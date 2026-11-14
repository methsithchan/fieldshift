"use client";

import { useState } from "react";
import Map from "@/components/Map";
import RainfallChart from "@/components/Charts/RainfallChart";
import TemperatureChart from "@/components/Charts/TemperatureChart";
import SoilWetnessChart from "@/components/Charts/SoilWetnessChart";
import { useNasaData } from "@/lib/hooks/useNasaData";

// APPROXIMATE COORDINATES: Padaviya area, Anuradhapura, Sri Lanka (~8.48°N, 80.72°E).
// NOTE: Needs verification on an official agricultural/survey map by user.
const DEFAULT_PADAVIYA_LAT = 8.48;
const DEFAULT_PADAVIYA_LON = 80.72;

// Convenient location presets for quick testing across Sri Lanka's climatic zones
const LOCATION_PRESETS = [
  { name: "Padaviya (Dry Zone)", lat: 8.48, lon: 80.72 },
  { name: "Anuradhapura Central", lat: 8.31, lon: 80.4 },
  { name: "Polonnaruwa (Dry Zone)", lat: 7.94, lon: 81.0 },
  { name: "Hambantota (Semi-Arid)", lat: 6.12, lon: 81.12 },
  { name: "Kandy (Wet Zone)", lat: 7.29, lon: 80.63 },
];

export default function Home() {
  const [lat, setLat] = useState<number>(DEFAULT_PADAVIYA_LAT);
  const [lon, setLon] = useState<number>(DEFAULT_PADAVIYA_LON);

  const { data, loading, error, refetch } = useNasaData(lat, lon);

  const handleLocationSelect = (newLat: number, newLon: number) => {
    setLat(Number(newLat.toFixed(4)));
    setLon(Number(newLon.toFixed(4)));
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8 border-b border-gray-200 pb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              🌾 Field Shift
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              NASA Earth Observations for Crop Rotation Decision Support & Soil Health
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 self-start sm:self-auto">
            <span>🛰️ NASA POWER API Connected</span>
            <span className="text-blue-400">·</span>
            <span>2015 – 2025 Climatology</span>
          </div>
        </div>
      </header>

      {/* Main Grid: Left Column = Map & Location; Right Column = Climate Observations */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Farm Location Picker */}
        <section className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">1. Select Farm Location</h2>
            <p className="mt-1 text-xs text-gray-500">
              Click anywhere on the map or choose a preset to fetch ~10-year NASA Earth observations.
            </p>

            <div className="mt-4">
              <Map lat={lat} lon={lon} onLocationSelect={handleLocationSelect} />
            </div>

            {/* Current Coordinates Display */}
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span>
                  <strong>Latitude:</strong> {lat.toFixed(4)}°N
                </span>
                <span>
                  <strong>Longitude:</strong> {lon.toFixed(4)}°E
                </span>
              </div>
              <p className="mt-2 text-[11px] text-amber-700">
                ⚠️ Default coords (~8.48°N, 80.72°E) are approximate Padaviya area. Verify field coordinates on local map.
              </p>
            </div>

            {/* Presets */}
            <div className="mt-4">
              <span className="text-xs font-medium text-gray-700">Quick Presets:</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {LOCATION_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleLocationSelect(preset.lat, preset.lon)}
                    className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                      Math.abs(lat - preset.lat) < 0.05 && Math.abs(lon - preset.lon) < 0.05
                        ? "bg-blue-600 text-white font-medium"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* NASA Data Resolution & Methodology Note */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-xs text-gray-600 space-y-2">
            <h3 className="font-semibold text-gray-900">NASA POWER Data Characteristics</h3>
            <p>
              • <strong>Resolution:</strong> ~0.5° × 0.5° (~55 km). Represents regional agro-climatology, not micro-plot sensors.
            </p>
            <p>
              • <strong>GWETROOT:</strong> Root-zone soil wetness index (0 = dry wilting, 1 = field capacity / fully saturated).
            </p>
            <p>
              • <strong>Missing Data:</strong> Standard NASA missing marker (-999) is purged and treated as null; never filled with fake values.
            </p>
          </div>
        </section>

        {/* Right Column: Climate Data & Visualizations */}
        <section className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">2. NASA Climate Observations</h2>
            {data && !loading && (
              <span className="text-xs text-gray-500">
                {data.dateRange.yearsAnalyzed} years analyzed ({data.totalDailyRecords.toLocaleString()} daily records)
              </span>
            )}
          </div>

          {/* Loading State: Plain "Loading..." text as requested */}
          {loading && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm font-medium text-gray-600">
              Loading NASA POWER climate data for [{lat.toFixed(4)}°N, {lon.toFixed(4)}°E]...
            </div>
          )}

          {/* Error State: Simple error message as requested */}
          {error && !loading && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              <p className="font-semibold">Unable to load NASA data</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={refetch}
                className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loaded Content */}
          {data && !loading && (
            <div className="space-y-6">
              {/* Seasonal Overview Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Maha Season (Oct – Feb)
                  </div>
                  <div className="mt-2 text-2xl font-bold text-blue-900">
                    {data.seasonalSummary.mahaRainfallMm} mm
                  </div>
                  <div className="mt-1 text-xs text-blue-700">
                    Mean Temp: {data.seasonalSummary.mahaAvgTempC}°C · Soil Wetness: {data.seasonalSummary.mahaAvgSoilWetness}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                    Yala Season (Apr – Aug)
                  </div>
                  <div className="mt-2 text-2xl font-bold text-amber-900">
                    {data.seasonalSummary.yalaRainfallMm} mm
                  </div>
                  <div className="mt-1 text-xs text-amber-700">
                    Mean Temp: {data.seasonalSummary.yalaAvgTempC}°C · Soil Wetness: {data.seasonalSummary.yalaAvgSoilWetness}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Annual Total Rainfall
                  </div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">
                    {data.seasonalSummary.annualRainfallMm} mm
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Mean Annual Temp: {data.seasonalSummary.annualAvgTempC}°C
                  </div>
                </div>
              </div>

              {/* Chart 1: Rainfall */}
              <RainfallChart data={data.climatology} />

              {/* Chart 2: Temperature */}
              <TemperatureChart data={data.climatology} />

              {/* Chart 3: Soil Wetness */}
              <SoilWetnessChart data={data.climatology} />

              {/* Raw Daily Records Sample (Verification Section) */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Raw NASA POWER Sample Records (First 5 Days)
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    Demonstrates raw data integrity & -999 conversion
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                        <th className="py-2 px-3 font-medium">Date</th>
                        <th className="py-2 px-3 font-medium">Precip (mm/day)</th>
                        <th className="py-2 px-3 font-medium">Temp (°C)</th>
                        <th className="py-2 px-3 font-medium">RH (%)</th>
                        <th className="py-2 px-3 font-medium">GWETROOT (0-1)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {data.rawSample.map((sample) => (
                        <tr key={sample.rawDate} className="hover:bg-gray-50/50">
                          <td className="py-2 px-3 font-sans font-medium text-gray-800">
                            {sample.date}
                          </td>
                          <td className="py-2 px-3 text-blue-600">
                            {sample.rainfallMm !== null ? `${sample.rainfallMm} mm` : "null"}
                          </td>
                          <td className="py-2 px-3 text-amber-600">
                            {sample.temperatureC !== null ? `${sample.temperatureC} °C` : "null"}
                          </td>
                          <td className="py-2 px-3 text-gray-600">
                            {sample.relativeHumidity !== null ? `${sample.relativeHumidity}%` : "null"}
                          </td>
                          <td className="py-2 px-3 text-emerald-600">
                            {sample.soilWetness !== null ? sample.soilWetness : "null"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Decision-Support Disclaimer Banner */}
      <div className="mt-12 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-950">
              Decision Support Notice — Farmers & Local Expert Authority
            </h4>
            <p className="text-xs leading-relaxed text-amber-800">
              Field Shift provides regional climate context derived from NASA POWER satellite and assimilation datasets (native resolution ~0.5° × 0.5°, roughly 55 km). It does <strong>not</strong> substitute for field-level soil testing, local agricultural extension officer guidance, or farmer experiential judgment. Always consult local agrarian service centers and Department of Agriculture guidelines.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
