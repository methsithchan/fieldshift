"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Map from "@/components/Map";
import RainfallChart from "@/components/Charts/RainfallChart";
import TemperatureChart from "@/components/Charts/TemperatureChart";
import SoilWetnessChart from "@/components/Charts/SoilWetnessChart";
import SoilForm from "@/components/SoilForm";
import PrioritySliders from "@/components/PrioritySliders";
import ExistingRotationSelector from "@/components/ExistingRotationSelector";
import ResultsCards from "@/components/ResultsCards";
import ModelAssumptionsPanel from "@/components/ModelAssumptionsPanel";
import { useNasaData } from "@/lib/hooks/useNasaData";
import { CULTIVATION_SEASONS } from "@/data/seasons";
import { SoilFormState, PriorityWeights } from "@/lib/types/engine";
import { getDefaultScenarios, evaluateAllScenarios } from "@/lib/engine/rotation";

// PADAVIYA COORDINATES: ~8.83°N, 80.76°E (Wikipedia / BirdLife Sri Lanka).
const DEFAULT_PADAVIYA_LAT = 8.83;
const DEFAULT_PADAVIYA_LON = 80.76;

const LOCATION_PRESETS = [
  { name: "Padaviya (Dry Zone)", lat: 8.83, lon: 80.76 },
  { name: "Mahailluppallama (Agri Research)", lat: 8.11, lon: 80.46 },
  { name: "Polonnaruwa (Dry Zone)", lat: 7.94, lon: 81.0 },
  { name: "Medawachchiya (Dry Zone)", lat: 8.54, lon: 80.49 },
  { name: "Dambulla (Dry/Intermediate)", lat: 7.87, lon: 80.65 },
];

function ExpertDashboardContent() {
  const searchParams = useSearchParams();

  const initialLat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : DEFAULT_PADAVIYA_LAT;
  const initialLon = searchParams.get("lon") ? parseFloat(searchParams.get("lon")!) : DEFAULT_PADAVIYA_LON;
  const initialMaha = searchParams.get("maha") || "rice";
  const initialYala = searchParams.get("yala") || "rice";

  const [lat, setLat] = useState<number>(initialLat);
  const [lon, setLon] = useState<number>(initialLon);

  useEffect(() => {
    if (searchParams.get("lat") && searchParams.get("lon")) {
      setLat(parseFloat(searchParams.get("lat")!));
      setLon(parseFloat(searchParams.get("lon")!));
    }
  }, [searchParams]);

  const { data, loading, error, refetch } = useNasaData(lat, lon);

  // Soil Form state: starts as Unknown
  const [soil, setSoil] = useState<SoilFormState>({
    ph: null,
    phConfidence: "unknown",
    texture: "unknown",
    textureConfidence: "unknown",
    organicCarbon: "unknown",
    organicCarbonConfidence: "unknown",
    drainage: "unknown",
    drainageConfidence: "unknown",
  });

  // Priority Weights
  const [weights, setWeights] = useState<PriorityWeights>({
    rainfallCoverage: 50,
    soilHealth: 50,
    economicPotential: 0,
  });

  // Existing 3-season crop rotation for Strategy A
  const [existingCrops, setExistingCrops] = useState<[string, string, string]>([
    initialMaha,
    initialYala,
    initialMaha,
  ]);

  // Dynamic seasons lookup
  const mahaSeason = CULTIVATION_SEASONS.find((s) => s.id === "maha");
  const yalaSeason = CULTIVATION_SEASONS.find((s) => s.id === "yala");

  const mahaLabel = mahaSeason
    ? `${mahaSeason.name} (${mahaSeason.startMonthName.slice(0, 3)} – ${mahaSeason.endMonthName.slice(0, 3)})`
    : "Maha Season";

  const yalaLabel = yalaSeason
    ? `${yalaSeason.name} (${yalaSeason.startMonthName.slice(0, 3)} – ${yalaSeason.endMonthName.slice(0, 3)})`
    : "Yala Season";

  const handleLocationSelect = (newLat: number, newLon: number) => {
    setLat(Number(newLat.toFixed(4)));
    setLon(Number(newLon.toFixed(4)));
  };

  const DRY_ZONE_BOX = { latMin: 7.0, latMax: 10.0, lonMin: 79.5, lonMax: 81.5 };
  const isOutsideDryZone =
    lat < DRY_ZONE_BOX.latMin ||
    lat > DRY_ZONE_BOX.latMax ||
    lon < DRY_ZONE_BOX.lonMin ||
    lon > DRY_ZONE_BOX.lonMax;

  const scenarios = useMemo(
    () => getDefaultScenarios(existingCrops),
    [existingCrops]
  );

  const evaluations = useMemo(
    () => evaluateAllScenarios(scenarios, data, soil, weights),
    [scenarios, data, soil, weights]
  );

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-6 sm:py-8 lg:px-8 space-y-6 sm:space-y-10">
      {/* Back to Farmer Wizard Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Expert Details &amp; Scientific Reference
          </span>
          <p className="text-sm font-medium text-blue-950 mt-0.5">
            Full NASA POWER meteorological dataset, 11-year monthly charts, and heuristic transparency model.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors self-start sm:self-auto shrink-0"
        >
          ← Back to start
        </Link>
      </div>

      {/* Header */}
      <header className="border-b border-gray-200 pb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              🌾 Field Shift — Expert Details View
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              NASA Earth Observations for Crop Rotation Decision Support &amp; Soil Health
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 self-start sm:self-auto">
            <span>🛰️ NASA POWER API Connected</span>
            <span className="text-blue-400">·</span>
            <span>2015 – 2025 Climatology (11-Year Daily Observations)</span>
          </div>
        </div>
      </header>

      {/* Dry Zone Warning Banner */}
      {isOutsideDryZone && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 font-bold mt-0.5">⚠️</span>
            <div>
              <span className="font-bold">Outside approximate Dry Zone boundary:</span> Crop data comes from Dry Zone research stations; results elsewhere are not meaningful. (Selected location is outside the approximate Dry Zone bounding box 7.0°N–10.0°N, 79.5°E–81.5°E).
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Location & NASA Climate Observations */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Farm Location Picker */}
        <section className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">1. Select Farm Location</h2>
            <p className="mt-1 text-xs text-gray-500">
              Click anywhere on the map or choose a preset to fetch 11-year NASA Earth observations.
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
              <p className="mt-2 text-[11px] text-gray-600">
                Default: Padaviya area (~8.83°N, 80.76°E; Wikipedia / BirdLife). Coarse 0.5° grid resolution.
              </p>
            </div>

            {/* Presets */}
            <div className="mt-4">
              <span className="text-xs font-medium text-gray-700">Inland Agri Presets:</span>
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
              • <strong>Resolution:</strong> ~0.5° × 0.5° (~55 km). Represents regional agro-climatology, not field-level microclimates.
            </p>
            <p>
              • <strong>Coastal Boundary Warning:</strong> Shoreline grid cells mix marine and land surface models, distorting terrestrial rainfall readings. Inland agricultural points provide the most accurate terrestrial estimates.
            </p>
            <p>
              • <strong>GWETROOT:</strong> Root-zone soil wetness index (0.0 to 1.0, dimensionless model estimate).
            </p>
            <p>
              • <strong>Missing Data:</strong> NASA fill value (-999) is purged and converted to null; never silently replaced with numbers.
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

          {/* Loading State */}
          {loading && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm font-medium text-gray-600">
              Loading NASA POWER climate data for [{lat.toFixed(4)}°N, {lon.toFixed(4)}°E]...
            </div>
          )}

          {/* Error State */}
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
                    {mahaLabel}
                  </div>
                  <div className="mt-2 text-2xl font-bold text-blue-900">
                    {data.seasonalSummary.mahaRainfallMm !== null
                      ? `${data.seasonalSummary.mahaRainfallMm} mm`
                      : "No valid data"}
                  </div>
                  <div className="mt-1 text-xs text-blue-700">
                    Mean Temp: {data.seasonalSummary.mahaAvgTempC !== null ? `${data.seasonalSummary.mahaAvgTempC}°C` : "N/A"} · Soil Wetness: {data.seasonalSummary.mahaAvgSoilWetness !== null ? data.seasonalSummary.mahaAvgSoilWetness : "N/A"}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                    {yalaLabel}
                  </div>
                  <div className="mt-2 text-2xl font-bold text-amber-900">
                    {data.seasonalSummary.yalaRainfallMm !== null
                      ? `${data.seasonalSummary.yalaRainfallMm} mm`
                      : "No valid data"}
                  </div>
                  <div className="mt-1 text-xs text-amber-700">
                    Mean Temp: {data.seasonalSummary.yalaAvgTempC !== null ? `${data.seasonalSummary.yalaAvgTempC}°C` : "N/A"} · Soil Wetness: {data.seasonalSummary.yalaAvgSoilWetness !== null ? data.seasonalSummary.yalaAvgSoilWetness : "N/A"}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Annual Total Rainfall
                  </div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">
                    {data.seasonalSummary.annualRainfallMm !== null
                      ? `${data.seasonalSummary.annualRainfallMm} mm`
                      : "No valid data"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Mean Annual Temp: {data.seasonalSummary.annualAvgTempC !== null ? `${data.seasonalSummary.annualAvgTempC}°C` : "N/A"}
                  </div>
                </div>
              </div>

              {/* Chart 1: Rainfall */}
              <RainfallChart data={data.climatology} />

              {/* Chart 2: Temperature */}
              <TemperatureChart data={data.climatology} />

              {/* Chart 3: Soil Wetness */}
              <SoilWetnessChart data={data.climatology} />

              {/* Raw Daily Records Sample */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Raw NASA POWER Sample Records (First 5 Days)
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    Demonstrates raw data integrity &amp; -999 conversion
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

      {/* Section: Soil Characteristics, Priority Weights, Existing Rotation Selector */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <SoilForm value={soil} onChange={setSoil} />
        <div className="space-y-6">
          <PrioritySliders weights={weights} onChange={setWeights} />
          <ExistingRotationSelector
            existingCropIds={existingCrops}
            onChange={setExistingCrops}
          />
        </div>
      </div>

      {/* Section: Three Results Cards */}
      <ResultsCards evaluations={evaluations} />

      {/* Section: Visible Model Assumptions Panel */}
      <ModelAssumptionsPanel />

      {/* Decision-Support Disclaimer Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-950">
              Decision Support Notice — Farmers &amp; Local Expert Authority
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

export default function ExpertPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-gray-500">Loading Expert View...</div>}>
      <ExpertDashboardContent />
    </Suspense>
  );
}
