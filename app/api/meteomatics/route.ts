import { NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_PARAMETERS,
  ALLOWED_SET,
  CACHE_TTL_MS,
  getCacheKey,
  meteomaticsServerCache,
  checkMeteomaticsRateLimit,
  getMeteomaticsTimeWindow,
  sumHoursAtOrAfterNow,
  MeteomaticsRawResponse,
} from "@/lib/utils/meteomatics";

export const maxDuration = 30;

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  // Client IP extraction
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (!checkMeteomaticsRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment before trying again." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);

  // Validate lat / lon
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");

  if (!latParam || !lonParam) {
    return NextResponse.json(
      { error: "Missing required query parameters: 'lat' and 'lon' are required." },
      { status: 400 }
    );
  }

  const lat = parseFloat(latParam);
  const lon = parseFloat(lonParam);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    return NextResponse.json(
      { error: `Invalid latitude: '${latParam}'. Must be a valid number between -90 and 90.` },
      { status: 400 }
    );
  }

  if (isNaN(lon) || lon < -180 || lon > 180) {
    return NextResponse.json(
      { error: `Invalid longitude: '${lonParam}'. Must be a valid number between -180 and 180.` },
      { status: 400 }
    );
  }

  // Validate parameters against allowlist
  const rawParams = searchParams.get("parameters") || searchParams.get("params") || "precip_1h:mm";
  const paramList = rawParams
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (paramList.length === 0) {
    return NextResponse.json(
      { error: "No parameters specified. Allowed: " + ALLOWED_PARAMETERS.join(", ") },
      { status: 400 }
    );
  }

  for (const p of paramList) {
    if (!ALLOWED_SET.has(p)) {
      return NextResponse.json(
        {
          error: `Disallowed parameter: '${p}'. Allowed parameters: ${ALLOWED_PARAMETERS.join(", ")}`,
        },
        { status: 400 }
      );
    }
  }

  const validatedParamsStr = paramList.join(",");

  // Validate or build validDateTime
  const customValidDateTime = searchParams.get("validdatetime");
  let validDateTime: string;

  if (customValidDateTime) {
    const isoIntervalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z(--\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z(:PT\d+[HMS])?)?$/;
    if (!isoIntervalRegex.test(customValidDateTime)) {
      return NextResponse.json(
        {
          error: `Invalid validdatetime format: '${customValidDateTime}'. Must be ISO UTC interval e.g. 2026-11-15T00:00:00Z--2026-11-22T00:00:00Z:PT1H`,
        },
        { status: 400 }
      );
    }
    validDateTime = customValidDateTime;
  } else {
    // Default: current hour in UTC rounded down to +7 days
    const timeWindow = getMeteomaticsTimeWindow();
    validDateTime = timeWindow.validDateTime;
  }

  // Cache Check
  const cacheKey = getCacheKey(lat, lon, validatedParamsStr, validDateTime);
  const cached = meteomaticsServerCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { "X-Cache": "HIT" },
    });
  }

  // Credentials Check
  const username = process.env.METEOMATICS_USER;
  const password = process.env.METEOMATICS_PASS;

  if (!username || !password) {
    return NextResponse.json(
      {
        error: "Meteomatics credentials not configured on the server. METEOMATICS_USER and METEOMATICS_PASS must be set.",
      },
      { status: 503 }
    );
  }

  // Build Request: https://api.meteomatics.com/validdatetime/parameters/locations/format
  const locationStr = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const meteomaticsUrl = `https://api.meteomatics.com/${validDateTime}/${validatedParamsStr}/${locationStr}/json`;

  const authHeader = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(meteomaticsUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      // Do not log or leak credentials
      const statusText = res.statusText || "Upstream Error";
      return NextResponse.json(
        {
          error: `Meteomatics API error (${res.status}): ${statusText}`,
          source: "Meteomatics",
        },
        { status: 502 }
      );
    }

    const json: MeteomaticsRawResponse = await res.json();

    // Compute supplementary 7-day hourly sum if precip_1h:mm is present
    let sum7dPrecipMm: number | null = null;
    const precipData = json.data?.find((d) => d.parameter === "precip_1h:mm");
    if (precipData && precipData.coordinates?.[0]?.dates) {
      sum7dPrecipMm = sumHoursAtOrAfterNow(precipData.coordinates[0].dates);
    }

    const payload = {
      status: "OK",
      source: "Meteomatics API",
      attribution: "Meteomatics Weather API (supplementary model forecast)",
      location: { lat, lon },
      validDateTime,
      parameters: validatedParamsStr,
      sum7dPrecipMm,
      raw: json,
    };

    // Cache successful response
    meteomaticsServerCache.set(cacheKey, { data: payload, timestamp: Date.now() });

    return NextResponse.json(payload, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Meteomatics request timed out after 10 seconds." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Failed to connect to Meteomatics API." },
      { status: 502 }
    );
  }
}
