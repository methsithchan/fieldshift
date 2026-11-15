"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { LanguageCode, TRANSLATIONS } from "@/data/translations";
import { CROPS } from "@/data/crops";
import { useNasaData } from "@/lib/hooks/useNasaData";
import { buildFarmerScenarios } from "@/lib/engine/farmer-strategies";
import { evaluateAllScenarios } from "@/lib/engine/rotation";
import { SoilFormState, PriorityWeights } from "@/lib/types/engine";
import HelpSheet from "@/components/Wizard/HelpSheet";
import {
  CLIMATE_HAZARD_ADVICE,
  HISTORIC_REFERENCE_BUDGETS,
} from "@/data/crop_sourcing";

// Default coordinates: Padaviya (~8.83°N, 80.76°E)
const DEFAULT_PADAVIYA_LAT = 8.83;
const DEFAULT_PADAVIYA_LON = 80.76;

// Agricultural presets for the Dry and Intermediate Zones
const LOCATION_PRESETS = [
  { name: "Padaviya (Dry Zone)", lat: 8.83, lon: 80.76 },
  { name: "Mahailluppallama (Agri Research)", lat: 8.11, lon: 80.46 },
  { name: "Polonnaruwa (Dry Zone)", lat: 7.94, lon: 81.0 },
  { name: "Medawachchiya (Dry Zone)", lat: 8.54, lon: 80.49 },
  { name: "Dambulla (Dry/Intermediate)", lat: 7.87, lon: 80.65 },
  { name: "Anuradhapura (Dry Zone)", lat: 8.35, lon: 80.40 },
  { name: "Kurunegala (Intermediate)", lat: 7.48, lon: 80.36 },
  { name: "Hambantota (Dry Zone)", lat: 6.12, lon: 81.12 },
];

const CROP_IDS = ["rice", "green_gram", "cowpea", "black_gram", "maize"] as const;

export default function FarmerWizard() {
  // Role selection: null = not yet chosen
  const [role, setRole] = useState<"farmer" | "researcher" | null>(null);

  // Wizard step: 1 (Language), 2 (Location), 3 (Current Crops), 4 (Considered Crops), 5 (Results)
  const [step, setStep] = useState<number>(1);
  const [lang, setLang] = useState<LanguageCode>("en");

  // Step 2: Location
  const [lat, setLat] = useState<number>(DEFAULT_PADAVIYA_LAT);
  const [lon, setLon] = useState<number>(DEFAULT_PADAVIYA_LON);
  const [locationName, setLocationName] = useState<string>("Padaviya (Dry Zone)");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Step 3: Current Crops
  const [currentMahaCrop, setCurrentMahaCrop] = useState<string>("rice");
  const [currentYalaCrop, setCurrentYalaCrop] = useState<string>("rice");

  // Step 4: Considered Crops
  const [consideredCrops, setConsideredCrops] = useState<string[]>(["green_gram", "cowpea"]);

  // Help Sheet state
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Active translation dictionary
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // NASA Data hook
  const { data: climateData, loading: climateLoading, error: climateError } = useNasaData(lat, lon);

  // Default neutral soil and priority weights for wizard evaluation
  const defaultSoil: SoilFormState = useMemo(
    () => ({
      ph: null,
      phConfidence: "unknown",
      texture: "unknown",
      textureConfidence: "unknown",
      organicCarbon: "unknown",
      organicCarbonConfidence: "unknown",
      drainage: "unknown",
      drainageConfidence: "unknown",
    }),
    []
  );

  const defaultWeights: PriorityWeights = useMemo(
    () => ({
      rainfallCoverage: 50,
      soilHealth: 50,
      economicPotential: 0,
    }),
    []
  );

  // Build scenarios dynamically
  const scenarios = useMemo(
    () => buildFarmerScenarios(currentMahaCrop, currentYalaCrop, consideredCrops),
    [currentMahaCrop, currentYalaCrop, consideredCrops]
  );

  // Pure deterministic evaluations
  const evaluations = useMemo(
    () => evaluateAllScenarios(scenarios, climateData, defaultSoil, defaultWeights),
    [scenarios, climateData, defaultSoil, defaultWeights]
  );

  // Approximate Dry Zone boundary check (lat 7.0–10.0, lon 79.5–81.5)
  const DRY_ZONE_BOX = { latMin: 7.0, latMax: 10.0, lonMin: 79.5, lonMax: 81.5 };
  const isOutsideDryZone =
    lat < DRY_ZONE_BOX.latMin ||
    lat > DRY_ZONE_BOX.latMax ||
    lon < DRY_ZONE_BOX.lonMin ||
    lon > DRY_ZONE_BOX.lonMax;

  // Geolocation Handler
  const handleUseMyLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocError(t.locDeniedError);
      return;
    }
    setIsLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(4));
        const userLon = Number(pos.coords.longitude.toFixed(4));
        setLat(userLat);
        setLon(userLon);
        setLocationName(`GPS: ${userLat}°N, ${userLon}°E`);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setLocError(t.locDeniedError);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  // Toggle considered crop
  const toggleConsideredCrop = (cropId: string) => {
    if (consideredCrops.includes(cropId)) {
      setConsideredCrops(consideredCrops.filter((id) => id !== cropId));
    } else {
      setConsideredCrops([...consideredCrops, cropId]);
    }
  };

  // Static help text for the active screen
  const getStaticHelpText = (): string => {
    switch (step) {
      case 1:
        return t.helpLanguage;
      case 2:
        return t.helpLocation;
      case 3:
        return t.helpCurrentCrop;
      case 4:
        return t.helpConsideredCrops;
      case 5:
        return t.helpResults;
      default:
        return t.helpLanguage;
    }
  };

  // Context summary for Help LLM prompt
  const getScreenContextText = (): string => {
    const screenNames = [
      "Language selection page",
      "Farm location page",
      "Current crops page",
      "Alternative crops page",
      "Rotation strategy results page",
    ];
    let base = `${screenNames[step - 1]}. Active language: ${lang}. Current location: ${lat}°N, ${lon}°E (${locationName}). Current Maha crop: ${currentMahaCrop}, Current Yala crop: ${currentYalaCrop}. Considered alternative crops: ${consideredCrops.join(", ")}. Dry Zone status: ${isOutsideDryZone ? "Outside Dry Zone" : "Inside Dry Zone"}.`;
    if (step === 5) {
      const activeCropIds = Array.from(new Set([currentMahaCrop, currentYalaCrop, ...consideredCrops]));
      const hazardSnippets = CLIMATE_HAZARD_ADVICE.filter((h) => activeCropIds.includes(h.cropId as typeof CROP_IDS[number]))
        .map((h) => `${h.cropId} (${h.label}): "${h.advice}" (source: the crop recommendations book, p. ${h.sourcePage})`)
        .join("; ");
      base += ` Results available for active crops (${activeCropIds.join(", ")}). Sourced hazard advice from the crop recommendations book: ${hazardSnippets}.`;
    }
    return base;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-emerald-50/40 text-gray-900 pb-28 pt-4 px-4 sm:px-6">
      <div className="mx-auto max-w-xl">

        {/* App Header & Top Bar */}
        <header className="mb-4 flex items-center justify-between border-b border-emerald-950/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="Sprout">🌱</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-emerald-950">
                {t.appTitle}
              </h1>
              <p className="text-xs font-medium text-emerald-700">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Language pill toggle */}
          <div className="flex items-center rounded-lg bg-emerald-100/70 p-1 text-xs font-semibold text-emerald-900">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`rounded px-2 py-1 transition-colors ${
                lang === "en" ? "bg-white text-emerald-900 shadow-xs" : "hover:text-emerald-700"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("si")}
              className={`rounded px-2 py-1 transition-colors ${
                lang === "si" ? "bg-white text-emerald-900 shadow-xs" : "hover:text-emerald-700"
              }`}
            >
              සිං
            </button>
            <button
              type="button"
              onClick={() => setLang("ta")}
              className={`rounded px-2 py-1 transition-colors ${
                lang === "ta" ? "bg-white text-emerald-900 shadow-xs" : "hover:text-emerald-700"
              }`}
            >
              த
            </button>
          </div>
        </header>

        {/* ══════════════════════════════════════
            ROLE SELECTION SCREEN (step 0)
            ══════════════════════════════════════ */}
        {role === null && (
          <section className="space-y-4 animate-in fade-in">
            <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">{t.roleTitle}</h2>
              <p className="mt-1 text-sm text-gray-500">{t.roleSubtitle}</p>

              <div className="mt-6 grid grid-cols-1 gap-3">
                {/* Farmer card */}
                <button
                  type="button"
                  onClick={() => setRole("farmer")}
                  className="flex min-h-[80px] items-center gap-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 px-5 py-4 text-left transition-all hover:bg-emerald-100 active:scale-[0.99]"
                >
                  <span className="text-4xl">🌾</span>
                  <div>
                    <div className="text-lg font-bold text-emerald-950">{t.farmerRoleLabel}</div>
                    <div className="text-xs text-emerald-700 mt-0.5">{t.farmerRoleHint}</div>
                  </div>
                  <span className="ml-auto text-2xl text-emerald-600">→</span>
                </button>

                {/* Researcher card → /expert */}
                <Link
                  href="/expert"
                  className="flex min-h-[80px] items-center gap-4 rounded-2xl border-2 border-slate-300 bg-slate-50 px-5 py-4 text-left transition-all hover:bg-slate-100 active:scale-[0.99]"
                >
                  <span className="text-4xl">🔬</span>
                  <div>
                    <div className="text-lg font-bold text-slate-900">{t.researcherRoleLabel}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.researcherRoleHint}</div>
                  </div>
                  <span className="ml-auto text-2xl text-slate-500">→</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════
            FARMER WIZARD  (steps 1–5)
            ══════════════════════════════════════ */}
        {role === "farmer" && (
          <>
            {/* Progress Dots & Back Navigation */}
            <div className="mb-6 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors py-1 px-2 rounded hover:bg-emerald-100/50"
                >
                  ← {t.back}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setRole(null)}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors py-1 px-2 rounded hover:bg-gray-100/50"
                >
                  ← {t.back}
                </button>
              )}

              {/* Step dots */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-label={`Go to step ${s}`}
                    onClick={() => setStep(s)}
                    className={`h-2.5 rounded-full transition-all ${
                      s === step
                        ? "w-7 bg-emerald-700"
                        : s < step
                        ? "w-2.5 bg-emerald-400"
                        : "w-2.5 bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              <span className="text-xs font-semibold text-gray-500">
                {t.stepIndicator(step, 5)}
              </span>
            </div>

            {/* SCREEN 1: LANGUAGE SELECTION */}
            {step === 1 && (
              <section className="space-y-6 animate-in fade-in">
                <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t.langStepTitle}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {t.langStepSubtitle}
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => { setLang("en"); setStep(2); }}
                      className={`flex min-h-[64px] items-center justify-between rounded-xl border-2 p-4 text-left font-semibold transition-all ${
                        lang === "en"
                          ? "border-emerald-600 bg-emerald-50/60 text-emerald-950 shadow-xs"
                          : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🇬🇧</span>
                        <div>
                          <div className="text-lg">English</div>
                          <div className="text-xs text-gray-500">English Language</div>
                        </div>
                      </div>
                      <span className="text-xl text-emerald-700">→</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setLang("si"); setStep(2); }}
                      className={`flex min-h-[64px] items-center justify-between rounded-xl border-2 p-4 text-left font-semibold transition-all ${
                        lang === "si"
                          ? "border-emerald-600 bg-emerald-50/60 text-emerald-950 shadow-xs"
                          : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🇱🇰</span>
                        <div>
                          <div className="text-lg">සිංහල</div>
                          <div className="text-xs text-gray-500">Sinhala Language</div>
                        </div>
                      </div>
                      <span className="text-xl text-emerald-700">→</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setLang("ta"); setStep(2); }}
                      className={`flex min-h-[64px] items-center justify-between rounded-xl border-2 p-4 text-left font-semibold transition-all ${
                        lang === "ta"
                          ? "border-emerald-600 bg-emerald-50/60 text-emerald-950 shadow-xs"
                          : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🇱🇰</span>
                        <div>
                          <div className="text-lg">தமிழ்</div>
                          <div className="text-xs text-gray-500">Tamil Language</div>
                        </div>
                      </div>
                      <span className="text-xl text-emerald-700">→</span>
                    </button>
                  </div>

                  <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 py-3.5 text-base font-bold text-white shadow-sm hover:bg-emerald-800 transition-all active:scale-[0.99]"
                    >
                      {t.next} →
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* SCREEN 2: LOCATION */}
            {step === 2 && (
              <section className="space-y-6 animate-in fade-in">
                <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t.locStepTitle}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {t.locStepSubtitle}
                  </p>

                  {/* Dry Zone banner if out of bounds */}
                  {isOutsideDryZone && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      {t.outsideDryZoneWarning}
                    </div>
                  )}

                  {/* Geolocation Button */}
                  <div className="mt-6 space-y-3">
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={isLocating}
                      className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-emerald-50/80 px-4 py-3 text-base font-bold text-emerald-950 hover:bg-emerald-100 transition-all active:scale-[0.99]"
                    >
                      {isLocating ? (
                        <>
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-800 border-t-transparent" />
                          <span>{t.locating}</span>
                        </>
                      ) : (
                        <span>{t.useMyLocation}</span>
                      )}
                    </button>

                    {/* Privacy note */}
                    <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 border border-gray-100 flex items-start gap-2">
                      <span className="text-emerald-700">🔒</span>
                      <span>{t.noStoreNotice}</span>
                    </div>

                    {locError && (
                      <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                        {locError}
                      </div>
                    )}
                  </div>

                  {/* Fallback Preset Picker */}
                  <div className="mt-6 border-t border-gray-100 pt-5">
                    <label
                      htmlFor="locationPreset"
                      className="block text-sm font-semibold text-gray-800 mb-2"
                    >
                      {t.orSelectPreset}
                    </label>
                    <select
                      id="locationPreset"
                      value={`${lat},${lon}`}
                      onChange={(e) => {
                        const [pLat, pLon] = e.target.value.split(",").map(Number);
                        setLat(pLat);
                        setLon(pLon);
                        const match = LOCATION_PRESETS.find(
                          (p) => p.lat === pLat && p.lon === pLon
                        );
                        setLocationName(match ? match.name : `${pLat}°N, ${pLon}°E`);
                        setLocError(null);
                      }}
                      className="w-full min-h-[48px] rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-base text-gray-900 focus:border-emerald-600 focus:outline-hidden"
                    >
                      {LOCATION_PRESETS.map((p) => (
                        <option key={p.name} value={`${p.lat},${p.lon}`}>
                          {p.name} ({p.lat}°N, {p.lon}°E)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Current Active Selection Summary */}
                  <div className="mt-5 rounded-xl bg-emerald-50/50 p-4 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        {t.selectedLocation}
                      </div>
                      <div className="text-base font-bold text-emerald-950 mt-0.5">
                        {locationName}
                      </div>
                      <div className="text-xs text-gray-600 font-mono mt-0.5">
                        {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
                      </div>
                    </div>
                    <span className="text-2xl">📍</span>
                  </div>

                  {/* Navigation */}
                  <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-xl border border-gray-200 px-5 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      ← {t.back}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-base font-bold text-white shadow-sm hover:bg-emerald-800 transition-all active:scale-[0.99]"
                    >
                      {t.next} →
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* SCREEN 3: CURRENT CROPS (STRATEGY A BASELINE) */}
            {step === 3 && (
              <section className="space-y-6 animate-in fade-in">
                <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t.currentCropTitle}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {t.currentCropSubtitle}
                  </p>

                  <div className="mt-6 space-y-5">
                    {/* Maha Crop Selection */}
                    <div>
                      <label
                        htmlFor="currentMahaCrop"
                        className="block text-sm font-bold text-emerald-950 mb-1"
                      >
                        {t.mahaLabel}
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        {t.selectMahaPrompt}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {CROP_IDS.map((cId) => {
                          const isSelected = currentMahaCrop === cId;
                          const cropName = t.crops[cId] || CROPS[cId].name;
                          return (
                            <button
                              key={`maha-${cId}`}
                              type="button"
                              onClick={() => setCurrentMahaCrop(cId)}
                              className={`flex min-h-[52px] items-center justify-between rounded-xl border-2 px-4 py-2.5 text-left transition-all ${
                                isSelected
                                  ? "border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950 shadow-2xs"
                                  : "border-gray-200 bg-white font-medium text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              <span className="text-base">{cropName}</span>
                              {isSelected && <span className="text-emerald-700 font-bold text-lg">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Yala Crop Selection */}
                    <div className="pt-4 border-t border-gray-100">
                      <label
                        htmlFor="currentYalaCrop"
                        className="block text-sm font-bold text-emerald-950 mb-1"
                      >
                        {t.yalaLabel}
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        {t.selectYalaPrompt}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {CROP_IDS.map((cId) => {
                          const isSelected = currentYalaCrop === cId;
                          const cropName = t.crops[cId] || CROPS[cId].name;
                          return (
                            <button
                              key={`yala-${cId}`}
                              type="button"
                              onClick={() => setCurrentYalaCrop(cId)}
                              className={`flex min-h-[52px] items-center justify-between rounded-xl border-2 px-4 py-2.5 text-left transition-all ${
                                isSelected
                                  ? "border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950 shadow-2xs"
                                  : "border-gray-200 bg-white font-medium text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              <span className="text-base">{cropName}</span>
                              {isSelected && <span className="text-emerald-700 font-bold text-lg">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-xl border border-gray-200 px-5 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      ← {t.back}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-base font-bold text-white shadow-sm hover:bg-emerald-800 transition-all active:scale-[0.99]"
                    >
                      {t.next} →
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* SCREEN 4: CONSIDERED CROPS */}
            {step === 4 && (
              <section className="space-y-6 animate-in fade-in">
                <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t.consideredCropTitle}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {t.consideredCropSubtitle}
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t.selectAnyHint}
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {CROP_IDS.map((cId) => {
                        const isChecked = consideredCrops.includes(cId);
                        const cropName = t.crops[cId] || CROPS[cId].name;
                        const cropDef = CROPS[cId];
                        const isLegume = cropDef.nitrogenFixing;

                        return (
                          <button
                            key={`consider-${cId}`}
                            type="button"
                            onClick={() => toggleConsideredCrop(cId)}
                            className={`flex min-h-[56px] items-center justify-between rounded-xl border-2 p-3.5 text-left transition-all ${
                              isChecked
                                ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-2xs"
                                : "border-gray-200 bg-white text-gray-700 font-medium hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // handled by parent button onClick
                                className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div>
                                <div className="text-base font-semibold">{cropName}</div>
                                <div className="text-xs text-gray-500">
                                  {isLegume ? "🌱 Soil nitrogen enriching" : "🌾 Cereal grain crop"}
                                </div>
                              </div>
                            </div>

                            <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700">
                              {cropDef.maturity.daysRange
                                ? `${cropDef.maturity.daysRange[0]}–${cropDef.maturity.daysRange[1]}d`
                                : "Duration varies"}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {consideredCrops.length === 0 && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 mt-2">
                        {t.noneSelectedFallback}
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="rounded-xl border border-gray-200 px-5 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      ← {t.back}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(5)}
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 py-3.5 text-base font-bold text-white shadow-sm hover:bg-emerald-800 transition-all active:scale-[0.99]"
                    >
                      {t.viewResults} →
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* SCREEN 5: RESULTS */}
            {step === 5 && (
              <section className="space-y-4 animate-in fade-in">
                {/* Header */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t.resultsTitle}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{locationName}</p>
                </div>

                {climateLoading && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-600">
                    <div className="inline-block h-7 w-7 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mb-2" />
                    <p className="text-sm font-semibold text-gray-700">Loading rainfall data…</p>
                  </div>
                )}

                {climateError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    ⚠️ Rainfall data unavailable — showing estimates.
                  </div>
                )}

                {/* COMPACT VISUAL CARDS */}
                <div className="space-y-3">
                  {evaluations.map((evalItem) => {
                    const isA = evalItem.id === "A";
                    const isB = evalItem.id === "B";

                    const title = isA ? t.strategyATitle : isB ? t.strategyBTitle : t.strategyCTitle;
                    const badge = isA ? t.currentRotationBadge : isB ? t.legumeAltBadge : t.diversifiedAltBadge;
                    const isPartial = evalItem.scores.rainfallCoverageStatus === "partial";

                    // Crop sequence as pills
                    const cropPills = evalItem.steps.map((s) => t.crops[s.crop.id] || s.crop.name);

                    // Rainfall bars per season step
                    const rainfallBars = evalItem.steps.map((s) => {
                      const pct = s.waterCoverageRatio !== null ? Math.min(Math.round(s.waterCoverageRatio * 100), 100) : null;
                      const color =
                        pct === null ? "bg-gray-300" :
                        pct >= 80 ? "bg-emerald-500" :
                        pct >= 50 ? "bg-amber-400" :
                        "bg-rose-500";
                      const label =
                        pct === null ? "?" :
                        pct >= 80 ? "✓ Good" :
                        pct >= 50 ? "~ Partial" :
                        "✗ Low";
                      const labelColor =
                        pct === null ? "text-gray-500" :
                        pct >= 80 ? "text-emerald-700" :
                        pct >= 50 ? "text-amber-700" :
                        "text-rose-700";
                      return { pct, color, label, labelColor, seasonName: s.seasonName, cropName: t.crops[s.crop.id] || s.crop.name };
                    });

                    // Unique crops for hazard tips
                    const uniqueCrops = Array.from(new Set(evalItem.steps.map((s) => s.crop)));

                    // Top risks — first 2 only, stripped short
                    const topRisks = evalItem.risks.slice(0, 2);

                    return (
                      <div
                        key={evalItem.id}
                        className={`rounded-2xl border-2 overflow-hidden shadow-sm ${
                          isB
                            ? "border-emerald-500"
                            : "border-gray-200"
                        }`}
                      >
                        {/* Card colour strip header */}
                        <div className={`px-4 py-3 flex items-center justify-between ${
                          isA ? "bg-gray-100" : isB ? "bg-emerald-600" : "bg-blue-600"
                        }`}>
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isA ? "text-gray-500" : "text-white/80"}`}>
                              {badge}
                            </span>
                            <h3 className={`text-base font-bold leading-tight mt-0.5 ${isA ? "text-gray-900" : "text-white"}`}>
                              {title}
                            </h3>
                          </div>
                          {/* Score ring */}
                          {!isPartial && evalItem.scores.compositeScore !== null && (
                            <div className={`flex flex-col items-center rounded-xl px-3 py-1 ${isA ? "bg-white" : "bg-white/20"}`}>
                              <span className={`text-[10px] font-semibold ${isA ? "text-gray-500" : "text-white/80"}`}>Score</span>
                              <span className={`text-xl font-extrabold leading-none ${isA ? "text-gray-900" : "text-white"}`}>
                                {(evalItem.scores.compositeScore * 100).toFixed(0)}
                              </span>
                              <span className={`text-[10px] ${isA ? "text-gray-400" : "text-white/60"}`}>/100</span>
                            </div>
                          )}
                          {isPartial && (
                            <span className="rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">
                              {t.partialBadge}
                            </span>
                          )}
                        </div>

                        <div className="bg-white px-4 py-3 space-y-3">
                          {/* Crop sequence pills */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {cropPills.map((name, i) => (
                              <span key={i} className="flex items-center gap-1">
                                <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-900">
                                  {name}
                                </span>
                                {i < cropPills.length - 1 && (
                                  <span className="text-gray-400 text-sm font-bold">→</span>
                                )}
                              </span>
                            ))}
                          </div>

                          {/* Rainfall bars */}
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              💧 {t.rainfallSummaryLabel}
                            </div>
                            {rainfallBars.map((bar, i) => (
                              <div key={i}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs font-medium text-gray-600">{bar.seasonName} · {bar.cropName}</span>
                                  <span className={`text-xs font-bold ${bar.labelColor}`}>
                                    {bar.label}{bar.pct !== null ? ` (${bar.pct}%)` : ""}
                                  </span>
                                </div>
                                <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${bar.color}`}
                                    style={{ width: `${bar.pct ?? 0}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Climate tips — icon + 1 line each */}
                          {uniqueCrops.some((crop) => CLIMATE_HAZARD_ADVICE.some((h) => h.cropId === crop.id)) && (
                            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 space-y-1">
                              {uniqueCrops.map((crop) => {
                                const hazards = CLIMATE_HAZARD_ADVICE.filter((h) => h.cropId === crop.id);
                                if (hazards.length === 0) return null;
                                const dry = hazards.find((h) => h.hazard === "drought");
                                const wet = hazards.find((h) => h.hazard === "excess_rain");
                                return (
                                  <div key={crop.id} className="space-y-0.5">
                                    {dry && (
                                      <p className="text-xs text-amber-800">
                                        <span className="font-bold">☀️ Dry —</span> {dry.advice}
                                      </p>
                                    )}
                                    {wet && (
                                      <p className="text-xs text-blue-800">
                                        <span className="font-bold">🌧️ Wet —</span> {wet.advice}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Risk pills — 2 max */}
                          {topRisks.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {topRisks.map((risk, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800">
                                  ⚠️ {risk.length > 55 ? risk.slice(0, 55) + "…" : risk}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Expert Details Link */}
                <Link
                  href={`/expert?lat=${lat}&lon=${lon}&maha=${currentMahaCrop}&yala=${currentYalaCrop}`}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white shadow hover:bg-slate-900 transition-all active:scale-[0.99]"
                >
                  {t.expertDetailsButton}
                </Link>

                {/* Restart */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setRole(null); }}
                    className="text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors py-2 px-4 rounded-lg hover:bg-emerald-100/50"
                  >
                    {t.restartWizard}
                  </button>
                </div>
              </section>
            )}

          </> // close farmer wizard
        )}

        {/* PERSISTENT NEED HELP BUTTON (Bottom Center) */}
        <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-emerald-800 px-5 py-3 text-sm font-bold text-white shadow-xl hover:bg-emerald-900 transition-all hover:scale-105 active:scale-95 border-2 border-emerald-600"
          >
            <span>💬</span>
            <span>{t.needHelp}</span>
          </button>
        </div>

        {/* HELP SHEET MODAL */}
        <HelpSheet
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          lang={lang}
          screenId={
            step === 1
              ? "language"
              : step === 2
              ? "location"
              : step === 3
              ? "current_crops"
              : step === 4
              ? "considered_crops"
              : "results"
          }
          staticHelpText={getStaticHelpText()}
          screenContextText={getScreenContextText()}
        />
      </div>
    </main>
  );
}
