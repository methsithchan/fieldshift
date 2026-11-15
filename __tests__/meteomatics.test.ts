import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/meteomatics/route";
import {
  ALLOWED_PARAMETERS,
  getCacheKey,
  clearMeteomaticsCache,
  resetRateLimits,
  sumHoursAtOrAfterNow,
  sumHoursAtOrAfterNowWithCount,
  getWeeklyUsualRain,
  formatSriLankaTime,
  getMeteomaticsTimeWindow,
} from "@/lib/utils/meteomatics";
import { ProcessedClimateData } from "@/lib/types/nasa";

describe("Meteomatics API Route & Utilities", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.METEOMATICS_USER = "test_user";
    process.env.METEOMATICS_PASS = "test_pass";
    clearMeteomaticsCache();
    resetRateLimits();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    clearMeteomaticsCache();
    resetRateLimits();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Parameter Allowlist Tests
  // -------------------------------------------------------------------------
  describe("Parameter Allowlist", () => {
    it("defines the exact required allowlist parameters (t_2m:C, precip_1h:mm)", () => {
      expect(ALLOWED_PARAMETERS).toContain("t_2m:C");
      expect(ALLOWED_PARAMETERS).toContain("precip_1h:mm");
      expect(ALLOWED_PARAMETERS.length).toBe(2);
    });

    it("rejects disallowed parameters with 400 Bad Request", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/meteomatics?lat=8.83&lon=80.76&parameters=wind_speed_10m:ms"
      );
      const res = await GET(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/Disallowed parameter/i);
    });

    it("rejects malicious or invalid parameter injections with 400 Bad Request", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/meteomatics?lat=8.83&lon=80.76&parameters=precip_1h:mm;DROP TABLE"
      );
      const res = await GET(req);
      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Failure Paths & Validation
  // -------------------------------------------------------------------------
  describe("Failure Paths & Validation", () => {
    it("returns 400 if lat or lon is missing", async () => {
      const req1 = new NextRequest("http://localhost:3000/api/meteomatics?lon=80.76");
      const res1 = await GET(req1);
      expect(res1.status).toBe(400);

      const req2 = new NextRequest("http://localhost:3000/api/meteomatics?lat=8.83");
      const res2 = await GET(req2);
      expect(res2.status).toBe(400);
    });

    it("returns 400 for out-of-range or non-numeric coordinates", async () => {
      const req1 = new NextRequest(
        "http://localhost:3000/api/meteomatics?lat=95&lon=80.76"
      );
      const res1 = await GET(req1);
      expect(res1.status).toBe(400);

      const req2 = new NextRequest(
        "http://localhost:3000/api/meteomatics?lat=8.83&lon=200"
      );
      const res2 = await GET(req2);
      expect(res2.status).toBe(400);

      const req3 = new NextRequest(
        "http://localhost:3000/api/meteomatics?lat=abc&lon=def"
      );
      const res3 = await GET(req3);
      expect(res3.status).toBe(400);
    });

    it("returns 503 if METEOMATICS_USER or METEOMATICS_PASS is missing in process.env", async () => {
      delete process.env.METEOMATICS_USER;
      delete process.env.METEOMATICS_PASS;

      const req = new NextRequest(
        "http://localhost:3000/api/meteomatics?lat=8.83&lon=80.76&parameters=precip_1h:mm"
      );
      const res = await GET(req);
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toMatch(/credentials not configured/i);
    });

    it("returns 502 Bad Gateway if upstream Meteomatics API returns HTTP error", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid credentials",
      } as Response);

      const req = new NextRequest(
        "http://localhost:3000/api/meteomatics?lat=8.83&lon=80.76&parameters=precip_1h:mm"
      );
      const res = await GET(req);
      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toMatch(/Meteomatics API error/i);
    });

    it("returns 504 Gateway Timeout if upstream request times out / aborts", async () => {
      const abortErr = new Error("The operation was aborted.");
      abortErr.name = "AbortError";
      global.fetch = vi.fn().mockRejectedValue(abortErr);

      const req = new NextRequest(
        "http://localhost:3000/api/meteomatics?lat=8.83&lon=80.76&parameters=precip_1h:mm"
      );
      const res = await GET(req);
      expect(res.status).toBe(504);
      const body = await res.json();
      expect(body.error).toMatch(/timed out after 10 seconds/i);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Cache & Successful Fetch
  // -------------------------------------------------------------------------
  describe("In-Memory Cache (3h TTL)", () => {
    const mockMeteoPayload = {
      version: "3.0",
      user: "test_user",
      dateGenerated: "2026-11-15T10:00:00Z",
      status: "OK",
      data: [
        {
          parameter: "precip_1h:mm",
          coordinates: [
            {
              lat: 8.83,
              lon: 80.76,
              dates: [
                { date: "2026-11-15T10:00:00Z", value: 0.5 },
                { date: "2026-11-15T11:00:00Z", value: 1.2 },
              ],
            },
          ],
        },
      ],
    };

    it("generates cache key based on rounded location (1 decimal) and period", () => {
      const key = getCacheKey(8.8345, 80.7612, "precip_1h:mm", "2026-11-15T00:00:00Z");
      expect(key).toBe("8.8_80.8_precip_1h:mm_2026-11-15T00:00:00Z");
    });

    it("fetches upstream on cache MISS and returns cached response on second call with X-Cache: HIT", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockMeteoPayload,
      } as Response);
      global.fetch = mockFetch;

      const validDt = "2026-11-15T10:00:00Z--2026-11-22T10:00:00Z:PT1H";
      const url = `http://localhost:3000/api/meteomatics?lat=8.83&lon=80.76&parameters=precip_1h:mm&validdatetime=${validDt}`;

      // First call (MISS)
      const res1 = await GET(new NextRequest(url));
      expect(res1.status).toBe(200);
      expect(res1.headers.get("X-Cache")).toBe("MISS");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify request location sent to upstream Meteomatics is rounded to 1 decimal
      const upstreamUrl = mockFetch.mock.calls[0][0];
      expect(upstreamUrl).toContain("/8.8,80.8/json");

      // Second call (HIT)
      const res2 = await GET(new NextRequest(url));
      expect(res2.status).toBe(200);
      expect(res2.headers.get("X-Cache")).toBe("HIT");
      expect(mockFetch).toHaveBeenCalledTimes(1); // not called again
    });
  });

  // -------------------------------------------------------------------------
  // 4. Utility Functions (Hourly sum, NASA weekly comparison, Sri Lanka Time)
  // -------------------------------------------------------------------------
  describe("Meteomatics Utilities", () => {
    it("sums only hours at or after 'now' and counts the number of valid hours", () => {
      const now = new Date("2026-11-15T12:00:00Z");
      const dates = [
        { date: "2026-11-15T10:00:00Z", value: 10.0 }, // in the past -> ignored
        { date: "2026-11-15T11:00:00Z", value: 5.0 },  // in the past -> ignored
        { date: "2026-11-15T12:00:00Z", value: 2.5 },  // at now -> included
        { date: "2026-11-15T13:00:00Z", value: 4.5 },  // future -> included
        { date: "2026-11-15T14:00:00Z", value: 1.0 },  // future -> included
      ];

      const res = sumHoursAtOrAfterNowWithCount(dates, now);
      expect(res.sumMm).toBe(8.0); // 2.5 + 4.5 + 1.0
      expect(res.hoursCounted).toBe(3);

      const sum = sumHoursAtOrAfterNow(dates, now);
      expect(sum).toBe(8.0);
    });

    it("computes NASA POWER weekly usual average for current month", () => {
      const mockClimate: ProcessedClimateData = {
        coordinates: { latitude: 8.83, longitude: 80.76 },
        dateRange: { startDate: "20150101", endDate: "20251231", yearsAnalyzed: 11 },
        totalDailyRecords: 4017,
        missingRecordsCount: 0,
        climatology: Array.from({ length: 12 }, (_, i) => ({
          monthIndex: i,
          monthNumber: i + 1,
          monthName: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
          avgMonthlyRainfallMm: i === 10 ? 280 : 100, // Nov has 280 mm
          avgTemperatureC: 28,
          avgSoilWetness: 0.5,
          avgRelativeHumidity: 75,
          validDaysCount: 30,
          missingDaysCount: 0,
        })),
        seasonalSummary: {
          mahaRainfallMm: 800,
          mahaAvgTempC: 27,
          mahaAvgSoilWetness: 0.6,
          yalaRainfallMm: 350,
          yalaAvgTempC: 29,
          yalaAvgSoilWetness: 0.4,
          annualRainfallMm: 1150,
          annualAvgTempC: 28,
          annualAvgSoilWetness: 0.5,
        },
        rawSample: [],
        fetchedAt: "2026-11-15T00:00:00Z",
      };

      // In November (30 days), 280 mm * 7 / 30 = 65.33 -> 65 mm/week
      const novDate = new Date("2026-11-15T10:00:00Z");
      const weekly = getWeeklyUsualRain(mockClimate, novDate);
      expect(weekly).not.toBeNull();
      expect(weekly?.monthName).toBe("Nov");
      expect(weekly?.weeklyMm).toBe(65);
      expect(weekly?.yearsLabel).toBe("NASA 2015-2025");
    });

    it("formats Sri Lanka time (UTC+5:30) accurately", () => {
      const utcDate = new Date("2026-11-15T04:30:00Z");
      const slFormatted = formatSriLankaTime(utcDate);
      // 04:30 UTC + 5:30 = 10:00 AM
      expect(slFormatted).toMatch(/10:00/);
    });

    it("calculates Meteomatics 7-day hourly window rounded to the UTC hour", () => {
      const testNow = new Date("2026-11-15T10:45:22.123Z");
      const window = getMeteomaticsTimeWindow(testNow);
      expect(window.startIso).toBe("2026-11-15T10:00:00Z");
      expect(window.endIso).toBe("2026-11-22T10:00:00Z");
      expect(window.validDateTime).toBe("2026-11-15T10:00:00Z--2026-11-22T10:00:00Z:PT1H");
    });
  });
});
