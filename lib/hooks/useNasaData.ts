"use client";

import { useState, useEffect } from "react";
import { ProcessedClimateData } from "@/lib/types/nasa";

interface UseNasaDataResult {
  data: ProcessedClimateData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useNasaData(lat: number, lon: number): UseNasaDataResult {
  const [data, setData] = useState<ProcessedClimateData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/nasa-power?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`);
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Failed to fetch NASA data (HTTP ${res.status})`);
        }

        const json: ProcessedClimateData = await res.json();
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Error loading climate data";
          setError(msg);
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [lat, lon, fetchTrigger]);

  return {
    data,
    loading,
    error,
    refetch: () => setFetchTrigger((n) => n + 1),
  };
}
