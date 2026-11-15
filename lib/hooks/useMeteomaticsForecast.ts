"use client";

import { useState, useEffect } from "react";
import { ProcessedClimateData } from "@/lib/types/nasa";
import {
  getWeeklyUsualRain,
  formatSriLankaTime,
} from "@/lib/utils/meteomatics";

export interface ForecastLineData {
  next7DaysMm: number;
  usualWeeklyMm: number | null;
  usualMonthName: string | null;
  yearsLabel: string;
  sourceAttribution: string;
  updatedAtSriLanka: string;
}

// Client-side cache: 3 hours TTL
const clientCache = new Map<string, { data: ForecastLineData; timestamp: number }>();
const CLIENT_CACHE_TTL_MS = 3 * 60 * 60 * 1000;

export function useMeteomaticsForecast(
  lat: number,
  lon: number,
  climateData: ProcessedClimateData | null,
  enabled = true
): {
  forecast: ForecastLineData | null;
  loading: boolean;
  error: boolean;
} {
  const [forecast, setForecast] = useState<ForecastLineData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!enabled || isNaN(lat) || isNaN(lon)) {
      setForecast(null);
      return;
    }

    const roundedKey = `${lat.toFixed(1)}_${lon.toFixed(1)}`;
    const cached = clientCache.get(roundedKey);
    if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS) {
      setForecast(cached.data);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    async function fetchForecast() {
      try {
        const roundedLat = Number(lat.toFixed(1));
        const roundedLon = Number(lon.toFixed(1));
        const res = await fetch(
          `/api/meteomatics?lat=${roundedLat}&lon=${roundedLon}&parameters=precip_1h:mm`
        );

        if (!res.ok) {
          // If the API fails or credentials are unset, silently hide
          if (!cancelled) {
            setError(true);
            setForecast(null);
            setLoading(false);
          }
          return;
        }

        const json = await res.json();
        const sumMm = typeof json.sum7dPrecipMm === "number" ? json.sum7dPrecipMm : null;

        if (process.env.NODE_ENV !== "production") {
          console.log(
            `[Meteomatics Dev Client Hook] Location: [${roundedLat}, ${roundedLon}] | Hours counted: ${json.hoursCounted ?? "N/A"} | Summed mm: ${sumMm}`
          );
        }

        if (sumMm === null) {
          if (!cancelled) {
            setForecast(null);
            setLoading(false);
          }
          return;
        }

        const usual = getWeeklyUsualRain(climateData);
        const data: ForecastLineData = {
          next7DaysMm: Math.round(sumMm),
          usualWeeklyMm: usual?.weeklyMm ?? null,
          usualMonthName: usual?.monthName ?? null,
          yearsLabel: usual?.yearsLabel ?? "NASA 2015-2025",
          sourceAttribution: "Forecast: Meteomatics API (model) · Climatology: NASA POWER",
          updatedAtSriLanka: formatSriLankaTime(new Date()),
        };

        if (!cancelled) {
          clientCache.set(roundedKey, { data, timestamp: Date.now() });
          setForecast(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setForecast(null);
          setLoading(false);
        }
      }
    }

    fetchForecast();

    return () => {
      cancelled = true;
    };
  }, [lat, lon, climateData, enabled]);

  return { forecast, loading, error };
}
