import { ProcessedClimateData } from "@/lib/types/nasa";

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// ---------------------------------------------------------------------------
// 1. Parameter Allowlist
// ---------------------------------------------------------------------------
export const ALLOWED_PARAMETERS = ["t_2m:C", "precip_1h:mm"] as const;
export type AllowedParameter = (typeof ALLOWED_PARAMETERS)[number];
export const ALLOWED_SET = new Set<string>(ALLOWED_PARAMETERS);

// ---------------------------------------------------------------------------
// 2. Cache Helpers
// ---------------------------------------------------------------------------
export const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

export function getCacheKey(
  lat: number,
  lon: number,
  parameters: string,
  validDateTime: string
): string {
  const roundedLat = lat.toFixed(1);
  const roundedLon = lon.toFixed(1);
  return `${roundedLat}_${roundedLon}_${parameters}_${validDateTime}`;
}

export interface CachedMeteomaticsEntry {
  data: unknown;
  timestamp: number;
}

export const meteomaticsServerCache = new Map<string, CachedMeteomaticsEntry>();

export function clearMeteomaticsCache(): void {
  meteomaticsServerCache.clear();
}

// ---------------------------------------------------------------------------
// 3. Rate Limiter Helpers
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;

export function checkMeteomaticsRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, recent);
    return false;
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

export function resetRateLimits(): void {
  rateLimitMap.clear();
}

export interface MeteomaticsDateValue {
  date: string;
  value: number | null;
}

export interface MeteomaticsResponseData {
  parameter: string;
  coordinates: Array<{
    lat: number;
    lon: number;
    dates: MeteomaticsDateValue[];
  }>;
}

export interface MeteomaticsRawResponse {
  version: string;
  user: string;
  dateGenerated: string;
  status: string;
  data: MeteomaticsResponseData[];
}

export interface ForecastSummary {
  next7DaysMm: number;
  usualWeeklyMm: number | null;
  usualMonthName: string | null;
  yearsLabel: string;
  sourceAttribution: string;
  updatedAtSriLanka: string;
}

/**
 * Returns current hour rounded down to UTC :00:00.000Z
 * and +7 days end time for Meteomatics URL format.
 */
export function getMeteomaticsTimeWindow(now = new Date()): {
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
  validDateTime: string;
} {
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      0,
      0,
      0
    )
  );
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startIso = start.toISOString().replace(/\.\d{3}Z$/, "Z");
  const endIso = end.toISOString().replace(/\.\d{3}Z$/, "Z");
  const validDateTime = `${startIso}--${endIso}:PT1H`;
  return { start, end, startIso, endIso, validDateTime };
}

/**
 * Sums hourly precipitation for only those hours at or after `now`.
 * In dev mode only, logs the number of hours counted and the summed mm.
 * Never logs credentials.
 */
export function sumHoursAtOrAfterNowWithCount(
  dates: MeteomaticsDateValue[],
  now = new Date()
): { sumMm: number; hoursCounted: number } {
  const nowMs = now.getTime();
  let sum = 0;
  let hoursCounted = 0;
  for (const entry of dates) {
    if (!entry.date || entry.value === null || isNaN(entry.value)) {
      continue;
    }
    const entryMs = new Date(entry.date).getTime();
    if (entryMs >= nowMs) {
      sum += Math.max(0, entry.value);
      hoursCounted++;
    }
  }
  const sumMm = Number(sum.toFixed(1));
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[Meteomatics Dev Sanity Check] Hours counted: ${hoursCounted} | Summed mm: ${sumMm}`
    );
  }
  return { sumMm, hoursCounted };
}

export function sumHoursAtOrAfterNow(
  dates: MeteomaticsDateValue[],
  now = new Date()
): number {
  return sumHoursAtOrAfterNowWithCount(dates, now).sumMm;
}

/**
 * Computes weekly average rainfall from NASA POWER climatology for the current month.
 */
export function getWeeklyUsualRain(
  climateData: ProcessedClimateData | null,
  now = new Date()
): { monthName: string; weeklyMm: number; yearsLabel: string } | null {
  if (!climateData || !climateData.climatology || climateData.climatology.length < 12) {
    return null;
  }

  // Get month index in Sri Lanka Time (UTC+5:30)
  const slDateStr = now.toLocaleString("en-US", { timeZone: "Asia/Colombo" });
  const slMonthIndex = new Date(slDateStr).getMonth();

  const monthData = climateData.climatology[slMonthIndex];
  if (!monthData || monthData.avgMonthlyRainfallMm === null) {
    return null;
  }

  const daysInMonth = DAYS_IN_MONTH[slMonthIndex] || 30;
  const weeklyMm = Math.round((monthData.avgMonthlyRainfallMm * 7) / daysInMonth);
  const startYear = climateData.dateRange?.startDate?.slice(0, 4) || "2015";
  const endYear = climateData.dateRange?.endDate?.slice(0, 4) || "2025";
  const yearsLabel = `NASA ${startYear}-${endYear}`;

  return {
    monthName: monthData.monthName,
    weeklyMm,
    yearsLabel,
  };
}

/**
 * Formats a date or ISO string in Sri Lanka Time (Asia/Colombo, UTC+5:30).
 */
export function formatSriLankaTime(date: Date | string, locale = "en-GB"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}
