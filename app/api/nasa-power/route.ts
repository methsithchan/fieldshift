import { NextRequest, NextResponse } from "next/server";
import { NasaPowerRawResponse } from "@/lib/types/nasa";
import { processNasaClimateData } from "@/lib/utils/climate";

export const maxDuration = 60;

// In-memory cache for NASA POWER responses
// Key: `${lat.toFixed(4)}_${lon.toFixed(4)}_${start}_${end}`
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");
  const startParam = searchParams.get("start") || "20150101";
  const endParam = searchParams.get("end") || "20251231";

  // 1. Validation
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

  const dateRegex = /^\d{8}$/;
  if (!dateRegex.test(startParam)) {
    return NextResponse.json(
      { error: `Invalid start date: '${startParam}'. Must be in YYYYMMDD format.` },
      { status: 400 }
    );
  }

  if (!dateRegex.test(endParam)) {
    return NextResponse.json(
      { error: `Invalid end date: '${endParam}'. Must be in YYYYMMDD format.` },
      { status: 400 }
    );
  }

  if (parseInt(startParam, 10) > parseInt(endParam, 10)) {
    return NextResponse.json(
      { error: `Invalid date range: start date (${startParam}) cannot be after end date (${endParam}).` },
      { status: 400 }
    );
  }

  // 2. Cache Check
  const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}_${startParam}_${endParam}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { "X-Cache": "HIT" },
    });
  }

  // 3. Fetch from NASA POWER
  const powerUrl = new URL("https://power.larc.nasa.gov/api/temporal/daily/point");
  powerUrl.searchParams.set("parameters", "PRECTOTCORR,T2M,RH2M,GWETROOT");
  powerUrl.searchParams.set("community", "AG");
  powerUrl.searchParams.set("longitude", lon.toFixed(4));
  powerUrl.searchParams.set("latitude", lat.toFixed(4));
  powerUrl.searchParams.set("start", startParam);
  powerUrl.searchParams.set("end", endParam);
  powerUrl.searchParams.set("format", "JSON");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(powerUrl.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        {
          error: `NASA POWER API returned HTTP ${res.status}: ${res.statusText}`,
          details: errorText.slice(0, 300),
        },
        { status: 502 }
      );
    }

    const rawData: NasaPowerRawResponse = await res.json();

    if (!rawData.properties?.parameter) {
      return NextResponse.json(
        { error: "NASA POWER response did not contain expected parameter data." },
        { status: 502 }
      );
    }

    // Process into multi-year monthly averages and seasonal totals
    const processed = processNasaClimateData(rawData, lat, lon, startParam, endParam);

    // Save in cache
    cache.set(cacheKey, { data: processed, timestamp: Date.now() });

    return NextResponse.json(processed, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    return NextResponse.json(
      {
        error: "Failed to connect to NASA POWER API.",
        details: message,
      },
      { status: 504 }
    );
  }
}
