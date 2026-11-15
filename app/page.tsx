"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { LanguageCode, TRANSLATIONS, TranslationStrings } from "@/data/translations";
import { CROPS } from "@/data/crops";
import { useNasaData } from "@/lib/hooks/useNasaData";
import { computeCropSeasonWindow, CropSeasonWindow } from "@/lib/engine/crop-window";
import { useMeteomaticsForecast } from "@/lib/hooks/useMeteomaticsForecast";
import { buildFarmerScenarios } from "@/lib/engine/farmer-strategies";
import { evaluateAllScenarios } from "@/lib/engine/rotation";
import { SoilFormState, PriorityWeights } from "@/lib/types/engine";
import HelpSheet from "@/components/Wizard/HelpSheet";

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
type CropId = typeof CROP_IDS[number];

// Geographic boundaries for Sri Lanka and Dry Zone
const SRI_LANKA_BOX = { latMin: 5.8, latMax: 10.0, lonMin: 79.5, lonMax: 82.0 };
const DRY_ZONE_BOX = { latMin: 7.0, latMax: 10.0, lonMin: 79.5, lonMax: 81.5 };

const CROP_ICONS: Record<string, string> = {
  rice: "🌾",
  green_gram: "🌱",
  cowpea: "🥜",
  black_gram: "🌿",
  maize: "🌽",
};

interface SowingOption {
  id: "oct" | "nov" | "dec" | "apr" | "may";
  seasonId: "maha" | "yala";
  month: number;
  labelKey: "sowPeriodOct" | "sowPeriodNov" | "sowPeriodDec" | "sowPeriodApr" | "sowPeriodMay";
}

const SOWING_OPTIONS: SowingOption[] = [
  { id: "oct", seasonId: "maha", month: 10, labelKey: "sowPeriodOct" },
  { id: "nov", seasonId: "maha", month: 11, labelKey: "sowPeriodNov" },
  { id: "dec", seasonId: "maha", month: 12, labelKey: "sowPeriodDec" },
  { id: "apr", seasonId: "yala", month: 4, labelKey: "sowPeriodApr" },
  { id: "may", seasonId: "yala", month: 5, labelKey: "sowPeriodMay" },
];

interface RankedCrop {
  cropId: CropId;
  rank: number;
  score: number;
  window: CropSeasonWindow;
  verdict: string;
}

function rankSelectedCrops(
  selectedCropIds: CropId[],
  seasonId: "maha" | "yala",
  climateData: ReturnType<typeof useNasaData>["data"],
  t: TranslationStrings
): RankedCrop[] {
  // Agronomic suitability heuristic scores for Dry Zone:
  // In Yala: Cowpea (96) > Green Gram (90) > Black Gram (75) > Maize (50) > Rice (25)
  // In Maha: Rice (95 in lowlands/rainfed) > Black Gram (88) > Cowpea (84) > Green Gram (80) > Maize (78)
  const baseSuitability: Record<"maha" | "yala", Record<CropId, number>> = {
    yala: {
      cowpea: 96,
      green_gram: 90,
      black_gram: 75,
      maize: 50,
      rice: 25,
    },
    maha: {
      rice: 95,
      black_gram: 88,
      cowpea: 84,
      green_gram: 80,
      maize: 78,
    },
  };

  const list = selectedCropIds.map((cropId) => {
    const win = computeCropSeasonWindow(cropId, seasonId, climateData);
    const base = baseSuitability[seasonId][cropId] ?? 50;
    const coverageBonus = win.waterCoverageRatio !== null ? win.waterCoverageRatio * 10 : 0;
    const score = base + coverageBonus;
    const verdict = t.cropVerdicts[cropId]?.[seasonId] || "";

    return {
      cropId,
      score,
      window: win,
      verdict,
    };
  });

  // Sort descending by score
  list.sort((a, b) => b.score - a.score);

  return list.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

function getSowingMonthRange(
  cropId: CropId,
  seasonId: "maha" | "yala",
  lang: LanguageCode
): string {
  if (cropId === "rice" && seasonId === "maha") {
    if (lang === "si") return "ඔක්තෝබර් – නොවැම්බර්";
    if (lang === "ta") return "அக்டோபர் – நவம்பர்";
    return "October – November";
  }
  if (cropId === "green_gram" && seasonId === "maha") {
    if (lang === "si") return "නොවැම්බර්";
    if (lang === "ta") return "நவம்பர்";
    return "November";
  }
  if (seasonId === "maha") {
    if (lang === "si") return "ඔක්තෝබර්";
    if (lang === "ta") return "அக்டோபர்";
    return "October";
  }
  // Yala for all 5 crops
  if (lang === "si") return "අප්‍රේල්";
  if (lang === "ta") return "ஏப்ரல்";
  return "April";
}

export default function Home() {
  // Wizard state: 1 (Language), 2 (Location), 3 (Crops tick), 4 (Sowing period), 5 (Results)
  const [step, setStep] = useState<number>(1);
  const [lang, setLang] = useState<LanguageCode>("en");

  // Step 2: Location
  const [lat, setLat] = useState<number>(DEFAULT_PADAVIYA_LAT);
  const [lon, setLon] = useState<number>(DEFAULT_PADAVIYA_LON);
  const [locationName, setLocationName] = useState<string>("Padaviya (Dry Zone)");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Step 3: Multi-select Crops
  const [selectedCrops, setSelectedCrops] = useState<CropId[]>(["rice", "green_gram", "cowpea"]);

  // Step 4: Expected Sowing Period (defaults to October - Early Maha)
  const [sowingPeriodId, setSowingPeriodId] = useState<SowingOption["id"]>("oct");

  // See More panel toggle
  const [showSeeMore, setShowSeeMore] = useState<boolean>(false);

  // Help Sheet state
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Active translation dictionary
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // NASA Data hook
  const { data: climateData, loading: climateLoading, error: climateError } = useNasaData(lat, lon);

  // Supplementary Meteomatics Forecast hook (active on Result step)
  const { forecast: meteoForecast } = useMeteomaticsForecast(
    lat,
    lon,
    climateData,
    step === 5
  );

  // Resolve active sowing option
  const activeSowingOption =
    SOWING_OPTIONS.find((s) => s.id === sowingPeriodId) || SOWING_OPTIONS[0];
  const activeSeason = activeSowingOption.seasonId;

  // Toggle crop selection
  const toggleCrop = (cId: CropId) => {
    setSelectedCrops((prev) => {
      if (prev.includes(cId)) {
        return prev.filter((id) => id !== cId);
      } else {
        return [...prev, cId];
      }
    });
  };

  // Rank selected crops for the chosen sowing season
  const rankedCrops = useMemo(() => {
    if (selectedCrops.length === 0) return [];
    return rankSelectedCrops(selectedCrops, activeSeason, climateData, t);
  }, [selectedCrops, activeSeason, climateData, t]);

  const topMatch = rankedCrops[0] || null;
  const otherCrops = rankedCrops.slice(1);

  const topCoveragePercent =
    topMatch && topMatch.window.waterCoverageRatio !== null
      ? Math.round(topMatch.window.waterCoverageRatio * 100)
      : null;

  // Rotation scenarios for compact See More panel
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

  const scenarios = useMemo(() => {
    const primaryCrop = topMatch?.cropId || "rice";
    const secondaryCrop = otherCrops[0]?.cropId || (primaryCrop === "rice" ? "green_gram" : "rice");
    return buildFarmerScenarios(primaryCrop, secondaryCrop, selectedCrops);
  }, [topMatch, otherCrops, selectedCrops]);

  const evaluations = useMemo(
    () => evaluateAllScenarios(scenarios, climateData, defaultSoil, defaultWeights),
    [scenarios, climateData, defaultSoil, defaultWeights]
  );

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

  // Region Guard boundaries
  const isOutsideSriLanka =
    lat < SRI_LANKA_BOX.latMin ||
    lat > SRI_LANKA_BOX.latMax ||
    lon < SRI_LANKA_BOX.lonMin ||
    lon > SRI_LANKA_BOX.lonMax;

  const isOutsideDryZone =
    !isOutsideSriLanka &&
    (lat < DRY_ZONE_BOX.latMin ||
      lat > DRY_ZONE_BOX.latMax ||
      lon < DRY_ZONE_BOX.lonMin ||
      lon > DRY_ZONE_BOX.lonMax);

  // Localized Season Name
  const displayActiveSeasonName =
    activeSeason === "maha" ? t.journoMahaSeasonLabel : t.journoYalaSeasonLabel;

  // Context summary for Help AI chat
  const getScreenContextText = (): string => {
    return `Field Shift Farmer Wizard.
Language: ${lang}.
Location: ${locationName} (${lat}°N, ${lon}°E).
Selected crops: ${selectedCrops.map((c) => CROPS[c]?.name || c).join(", ")}.
Expected sowing period: ${t[activeSowingOption.labelKey]} (Season: ${activeSeason}).
Top recommended crop: ${topMatch ? CROPS[topMatch.cropId]?.name : "None"}.
Ranked alternatives: ${otherCrops.map((c) => `${c.rank}. ${CROPS[c.cropId]?.name} (${c.verdict})`).join("; ")}.
NASA POWER Climatology:
- Maha rainfall: ${climateData?.seasonalSummary.mahaRainfallMm ?? "N/A"} mm, Avg temp: ${climateData?.seasonalSummary.mahaAvgTempC ?? "N/A"}°C, Soil wetness: ${climateData?.seasonalSummary.mahaAvgSoilWetness ?? "N/A"}
- Yala rainfall: ${climateData?.seasonalSummary.yalaRainfallMm ?? "N/A"} mm, Avg temp: ${climateData?.seasonalSummary.yalaAvgTempC ?? "N/A"}°C, Soil wetness: ${climateData?.seasonalSummary.yalaAvgSoilWetness ?? "N/A"}
Meteomatics 7-day model forecast: ${meteoForecast ? `${meteoForecast.next7DaysMm} mm` : "forecast pending or unavailable"}.`;
  };

  return (
    <main className="min-h-[100dvh] bg-[#F7F7F8] text-neutral-900 flex flex-col justify-between p-4 sm:p-6 antialiased">
      {/* Top Header Bar */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌱</span>
          <span className="font-extrabold text-neutral-900 tracking-tight text-lg">
            {t.appTitle}
          </span>
        </div>

        {/* Language Switcher Pill */}
        <div className="flex items-center rounded-full bg-neutral-200/80 p-0.5 text-xs font-semibold text-neutral-600">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              lang === "en" ? "bg-white text-black shadow-xs font-bold" : "hover:text-black"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang("si")}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              lang === "si" ? "bg-white text-black shadow-xs font-bold" : "hover:text-black"
            }`}
          >
            සිං
          </button>
          <button
            type="button"
            onClick={() => setLang("ta")}
            className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              lang === "ta" ? "bg-white text-black shadow-xs font-bold" : "hover:text-black"
            }`}
          >
            த
          </button>
        </div>
      </header>

      {/* Main Journo-Style Card Container */}
      <div className="max-w-md mx-auto w-full my-auto py-4">
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-neutral-100/80 transition-all">
          {/* Top Progress & Back Header */}
          <div className="flex items-center justify-between mb-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 min-h-[44px] cursor-pointer"
              >
                <span>←</span>
                <span>{t.journoBackBtn}</span>
              </button>
            ) : (
              <div />
            )}

            {/* Progress Dots (5 Steps) */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? "w-6 bg-black"
                      : i < step
                      ? "w-1.5 bg-neutral-800"
                      : "w-1.5 bg-neutral-200"
                  }`}
                />
              ))}
            </div>

            <span className="text-[11px] font-semibold text-neutral-400">
              {step}/5
            </span>
          </div>

          {/* ══════════════════════════════════════════
              STEP 1: LANGUAGE SELECTION
             ══════════════════════════════════════════ */}
          {step === 1 && (
            <div className="animate-in fade-in duration-200">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                {t.journoLangTitle}
              </h1>
              <p className="text-sm text-neutral-500 font-medium mt-1 mb-6">
                {t.journoLangSubtitle}
              </p>

              <div className="space-y-3 mb-8">
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`w-full min-h-[56px] rounded-2xl border-2 p-4 text-left transition flex items-center justify-between cursor-pointer ${
                    lang === "en"
                      ? "border-black bg-neutral-50 font-bold"
                      : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
                  }`}
                >
                  <span className="text-base font-semibold">English</span>
                  {lang === "en" && <span className="text-black font-extrabold">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setLang("si")}
                  className={`w-full min-h-[56px] rounded-2xl border-2 p-4 text-left transition flex items-center justify-between cursor-pointer ${
                    lang === "si"
                      ? "border-black bg-neutral-50 font-bold"
                      : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
                  }`}
                >
                  <span className="text-base font-semibold">සිංහල (Sinhala)</span>
                  {lang === "si" && <span className="text-black font-extrabold">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setLang("ta")}
                  className={`w-full min-h-[56px] rounded-2xl border-2 p-4 text-left transition flex items-center justify-between cursor-pointer ${
                    lang === "ta"
                      ? "border-black bg-neutral-50 font-bold"
                      : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
                  }`}
                >
                  <span className="text-base font-semibold">தமிழ் (Tamil)</span>
                  {lang === "ta" && <span className="text-black font-extrabold">✓</span>}
                </button>
              </div>

              {/* Black Pill Next Button */}
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full min-h-[48px] rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-base py-3.5 px-6 shadow-sm transition active:scale-[0.98] flex items-center justify-center cursor-pointer"
              >
                {t.journoContinueBtn}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              STEP 2: LOCATION
             ══════════════════════════════════════════ */}
          {step === 2 && (
            <div className="animate-in fade-in duration-200">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                {t.journoLocTitle}
              </h1>
              <p className="text-sm text-neutral-500 font-medium mt-1 mb-6">
                {t.journoLocSubtitle}
              </p>

              {/* GPS Button */}
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="w-full min-h-[52px] rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-sm px-4 py-3.5 transition flex items-center justify-center gap-2 mb-2 cursor-pointer disabled:opacity-50"
              >
                <span>📍</span>
                <span>{isLocating ? t.journoLocating : t.journoUseMyLocation}</span>
              </button>

              {locError && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mb-4">
                  {locError}
                </p>
              )}

              {/* Privacy Note */}
              <p className="text-[11px] text-neutral-400 mb-6 flex items-center gap-1.5">
                <span>🔒</span>
                <span>{t.journoNotStoredNote}</span>
              </p>

              {/* District / Preset fallback */}
              <div className="space-y-2 mb-6">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                  {t.journoOrSelectArea}
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {LOCATION_PRESETS.slice(0, 6).map((preset) => {
                    const isSelected = lat === preset.lat && lon === preset.lon;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setLat(preset.lat);
                          setLon(preset.lon);
                          setLocationName(preset.name);
                        }}
                        className={`min-h-[48px] rounded-xl border text-xs font-semibold p-2.5 text-left transition cursor-pointer ${
                          isSelected
                            ? "border-black bg-neutral-900 text-white font-bold"
                            : "border-neutral-200 hover:border-neutral-300 bg-white text-neutral-800"
                        }`}
                      >
                        {preset.name.split(" (")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active selection banner */}
              <div className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600 mb-8 border border-neutral-200/50 flex items-center justify-between">
                <span>{t.selectedLocation}:</span>
                <span className="font-bold text-neutral-900">{locationName}</span>
              </div>

              {/* Black Pill Next Button */}
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full min-h-[48px] rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-base py-3.5 px-6 shadow-sm transition active:scale-[0.98] flex items-center justify-center cursor-pointer"
              >
                {t.journoContinueBtn}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              STEP 3: WHAT CROPS CAN YOU GROW? (MULTI-SELECT TICK)
             ══════════════════════════════════════════ */}
          {step === 3 && (
            <div className="animate-in fade-in duration-200">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                {t.journoSelectCropsTitle}
              </h1>
              <p className="text-sm text-neutral-500 font-medium mt-1 mb-6">
                {t.journoSelectCropsSubtitle}
              </p>

              <div className="space-y-3 mb-8">
                {CROP_IDS.map((cId) => {
                  const isChecked = selectedCrops.includes(cId);
                  return (
                    <button
                      key={cId}
                      type="button"
                      onClick={() => toggleCrop(cId)}
                      className={`w-full min-h-[56px] rounded-2xl border-2 p-4 text-left transition flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? "border-black bg-neutral-900 text-white font-bold shadow-xs"
                          : "border-neutral-200 hover:border-neutral-300 bg-white text-neutral-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{CROP_ICONS[cId]}</span>
                        <div>
                          <span className="text-sm sm:text-base font-bold block">
                            {t.crops[cId] || CROPS[cId].name}
                          </span>
                          <span className={`text-[11px] block ${isChecked ? "text-neutral-300" : "text-neutral-500"}`}>
                            {CROPS[cId].botanicalName}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                          isChecked
                            ? "bg-white text-black"
                            : "border-2 border-neutral-300 text-transparent"
                        }`}
                      >
                        ✓
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedCrops.length === 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mb-4 text-center">
                  ⚠️ {t.journoSelectAtLeastOne}
                </p>
              )}

              {/* Black Pill Next Button */}
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={selectedCrops.length === 0}
                className="w-full min-h-[48px] rounded-full bg-black hover:bg-neutral-800 disabled:opacity-40 text-white font-semibold text-base py-3.5 px-6 shadow-sm transition active:scale-[0.98] flex items-center justify-center cursor-pointer"
              >
                {t.journoContinueBtn}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              STEP 4: WHEN DO YOU PLAN TO SOW?
             ══════════════════════════════════════════ */}
          {step === 4 && (
            <div className="animate-in fade-in duration-200">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                {t.journoSowingTimeTitle}
              </h1>
              <p className="text-sm text-neutral-500 font-medium mt-1 mb-6">
                {t.journoSowingTimeSubtitle}
              </p>

              {/* Maha Season Group */}
              <div className="space-y-2 mb-6">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                  🌧️ {t.journoMahaSeasonGroup}
                </span>

                <div className="space-y-2">
                  {SOWING_OPTIONS.filter((o) => o.seasonId === "maha").map((option) => {
                    const isSelected = sowingPeriodId === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSowingPeriodId(option.id)}
                        className={`w-full min-h-[52px] rounded-2xl border-2 p-3.5 text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "border-black bg-neutral-900 text-white font-bold shadow-xs"
                            : "border-neutral-200 hover:border-neutral-300 bg-white text-neutral-800"
                        }`}
                      >
                        <span className="text-sm font-semibold">{t[option.labelKey]}</span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected ? "bg-white text-black" : "border border-neutral-300"
                          }`}
                        >
                          {isSelected && "✓"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Yala Season Group */}
              <div className="space-y-2 mb-8">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                  ☀️ {t.journoYalaSeasonGroup}
                </span>

                <div className="space-y-2">
                  {SOWING_OPTIONS.filter((o) => o.seasonId === "yala").map((option) => {
                    const isSelected = sowingPeriodId === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSowingPeriodId(option.id)}
                        className={`w-full min-h-[52px] rounded-2xl border-2 p-3.5 text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "border-black bg-neutral-900 text-white font-bold shadow-xs"
                            : "border-neutral-200 hover:border-neutral-300 bg-white text-neutral-800"
                        }`}
                      >
                        <span className="text-sm font-semibold">{t[option.labelKey]}</span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected ? "bg-white text-black" : "border border-neutral-300"
                          }`}
                        >
                          {isSelected && "✓"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Black Pill View Results Button */}
              <button
                type="button"
                onClick={() => setStep(5)}
                className="w-full min-h-[48px] rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-base py-3.5 px-6 shadow-sm transition active:scale-[0.98] flex items-center justify-center cursor-pointer"
              >
                {t.journoContinueBtn}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              STEP 5: RESULT SCREEN (Hero Best Crop + Ranked Alternatives)
             ══════════════════════════════════════════ */}
          {step === 5 && (
            <div className="animate-in fade-in duration-200">
              {/* Outside Sri Lanka Guard */}
              {isOutsideSriLanka ? (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center space-y-3 my-4">
                  <span className="text-3xl block">🇱🇰</span>
                  <h2 className="text-base sm:text-lg font-bold text-amber-950">
                    {t.outsideSriLankaTitle}
                  </h2>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {t.outsideSriLankaDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="mt-2 min-h-[48px] rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-semibold px-6 py-3 transition active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{t.journoBackBtn}</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Warning banner if inside Sri Lanka but outside Dry Zone */}
                  {isOutsideDryZone && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 mb-4 leading-relaxed">
                      {t.outsideDryZoneWarning}
                    </div>
                  )}

                  {/* Header Badge */}
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      {t[activeSowingOption.labelKey]}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                      {t.journoBestCropHeroTitle}
                    </h1>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">
                      {locationName} · {displayActiveSeasonName}
                    </p>
                  </div>

                  {/* NASA Loading State */}
                  {climateLoading && (
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center text-neutral-600 my-4">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent mb-2" />
                      <p className="text-xs font-semibold">{t.journoLocating}</p>
                    </div>
                  )}

                  {climateError && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 my-3">
                      ⚠️ Climate data notice: {climateError}. Showing standard Dry Zone seasonal indicators.
                    </div>
                  )}

                  {/* ──────────────────────────────────────────────────────────
                      HERO CARD: TOP MATCH CROP
                     ────────────────────────────────────────────────────────── */}
                  {topMatch && (
                    <div className="rounded-2xl bg-neutral-900 text-white p-5 my-4 space-y-4 shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-lime-400 text-neutral-950 text-[11px] font-black px-2.5 py-0.5 uppercase tracking-wider">
                          {t.journoTopMatchBadge}
                        </span>
                        {topMatch.window.isUnverifiedWaterNeed && (
                          <span className="rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 border border-amber-500/30">
                            {t.partialBadge}
                          </span>
                        )}
                      </div>

                      {/* Big Crop Title & Icon */}
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{CROP_ICONS[topMatch.cropId]}</span>
                        <div>
                          <h2 className="text-2xl font-black tracking-tight text-white">
                            {t.crops[topMatch.cropId] || CROPS[topMatch.cropId].name}
                          </h2>
                          <span className="text-xs text-neutral-400">
                            {CROPS[topMatch.cropId].botanicalName}
                          </span>
                        </div>
                      </div>

                      {/* Big Coverage Number or Unverified Notice */}
                      <div className="pt-2 border-t border-neutral-800">
                        {topMatch.window.isUnverifiedWaterNeed ? (
                          <div className="space-y-1">
                            <div className="text-base font-bold text-neutral-200">
                              ~{topMatch.window.windowRainfallMm ?? "—"} mm rainfall window
                            </div>
                            <p className="text-xs text-neutral-400">
                              {t.noRainfallDataDesc}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                              {topCoveragePercent}%
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-neutral-300">
                              {t.waterCoveragePlain(topCoveragePercent ?? 0)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Concise Verdict on why it is the top match */}
                      <div className="rounded-xl bg-neutral-800/80 p-3 text-xs text-neutral-200 leading-relaxed border border-neutral-700/60">
                        <span className="font-bold text-lime-400 block mb-0.5">
                          ✓ Why it fits:
                        </span>
                        <span>{topMatch.verdict}</span>
                      </div>

                      {/* Sowing Line */}
                      <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">
                          {t.sowAround(getSowingMonthRange(topMatch.cropId, activeSeason, lang))}
                        </span>
                      </div>

                      {/* Ignores Irrigation Line */}
                      <p className="text-[11px] text-neutral-400 italic pt-1 border-t border-neutral-800/60">
                        {t.journoIgnoresIrrigation}
                      </p>
                    </div>
                  )}

                  {/* ──────────────────────────────────────────────────────────
                      RANKED LIST OF OTHER SELECTED CROPS
                     ────────────────────────────────────────────────────────── */}
                  {otherCrops.length > 0 && (
                    <div className="space-y-2.5 my-5">
                      <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                        {t.journoOtherCropsRankedTitle}
                      </h3>

                      <div className="space-y-2">
                        {otherCrops.map((item) => {
                          const coveragePct =
                            item.window.waterCoverageRatio !== null
                              ? Math.round(item.window.waterCoverageRatio * 100)
                              : null;

                          return (
                            <div
                              key={item.cropId}
                              className="rounded-2xl border border-neutral-200 bg-white p-3.5 space-y-2 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-neutral-400 bg-neutral-100 rounded-md px-1.5 py-0.5">
                                    #{item.rank}
                                  </span>
                                  <span className="text-lg">{CROP_ICONS[item.cropId]}</span>
                                  <span className="font-bold text-neutral-900 text-sm">
                                    {t.crops[item.cropId] || CROPS[item.cropId].name}
                                  </span>
                                </div>

                                <div className="text-right shrink-0">
                                  {coveragePct !== null ? (
                                    <span className="font-black text-neutral-900 text-xs">
                                      {coveragePct}% rain-covered
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-amber-500/15 text-amber-800 text-[10px] font-bold px-2 py-0.5">
                                      {t.partialBadge}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* One-line verdict explaining why it is ranked lower / why others are bad */}
                              <p className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 leading-relaxed">
                                {item.verdict}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Honesty Advice */}
                  <p className="text-[11px] text-neutral-400 leading-relaxed text-center mb-4">
                    {t.journoHonestyAdvice}
                  </p>

                  {/* ──────────────────────────────────────────────────────────
                      "SEE MORE DETAILS" BUTTON & CLEAN PANEL (NO LONG BOXES)
                     ────────────────────────────────────────────────────────── */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowSeeMore((prev) => !prev)}
                      className="w-full min-h-[48px] rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-sm py-3 px-6 shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{showSeeMore ? t.journoSeeMoreCloseBtn : t.journoSeeMoreBtn}</span>
                      <span>{showSeeMore ? "↑" : "↓"}</span>
                    </button>

                    {showSeeMore && (
                      <div className="rounded-3xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-4 animate-in fade-in duration-200 mt-2">
                        {/* Supplementary Meteomatics Forecast Line */}
                        {meteoForecast && (
                          <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                              <span>🌧️ {t.journoForecastTitle}</span>
                              {meteoForecast.updatedAtSriLanka && (
                                <span className="font-normal text-[10px] text-neutral-400">
                                  {meteoForecast.updatedAtSriLanka} ({t.journoSriLankaTimeLabel})
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
                              <span className="text-sm font-extrabold text-neutral-900">
                                {t.journoNext7DaysForecast(meteoForecast.next7DaysMm)}
                              </span>
                              {meteoForecast.usualWeeklyMm !== null && (
                                <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                                  {t.journoUsualWeeklyRain(
                                    meteoForecast.usualWeeklyMm,
                                    meteoForecast.yearsLabel
                                  )}
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-100 leading-tight">
                              {t.journoForecastAttribution}
                            </p>
                          </div>
                        )}

                        {/* Climate & Soil Indicators Card */}
                        <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                            <span>📊 {t.journoClimateIndicatorsTitle}</span>
                            <span className="text-[10px] text-neutral-400 font-normal">NASA POWER</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-xl bg-neutral-50 p-2 border border-neutral-100">
                              <span className="text-[10px] font-semibold text-neutral-500 block">
                                💧 {t.journoSoilWetnessLabel}
                              </span>
                              <div className="mt-0.5 font-extrabold text-neutral-900 text-xs">
                                Maha: {climateData?.seasonalSummary.mahaAvgSoilWetness ?? "0.60"} · Yala: {climateData?.seasonalSummary.yalaAvgSoilWetness ?? "0.38"}
                              </div>
                            </div>

                            <div className="rounded-xl bg-neutral-50 p-2 border border-neutral-100">
                              <span className="text-[10px] font-semibold text-neutral-500 block">
                                🌡️ {t.journoAvgTempLabel}
                              </span>
                              <div className="mt-0.5 font-extrabold text-neutral-900 text-xs">
                                Maha: {climateData?.seasonalSummary.mahaAvgTempC ?? "27"}°C · Yala: {climateData?.seasonalSummary.yalaAvgTempC ?? "29"}°C
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 3-Season Rotation Alternatives: Clean and compact without verbose detail boxes */}
                        <div className="space-y-2 pt-1">
                          <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                            {t.journoCompareRotationsTitle}
                          </h4>

                          <div className="space-y-2">
                            {evaluations.map((ev) => {
                              const isBaseline = ev.id === "A";
                              const title =
                                isBaseline
                                  ? t.journoStrategyATitle
                                  : ev.id === "B"
                                  ? t.journoStrategyBTitle
                                  : t.journoStrategyCTitle;

                              return (
                                <div
                                  key={ev.id}
                                  className="rounded-2xl border border-neutral-200 bg-white p-3 space-y-1.5 shadow-2xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-neutral-900">
                                      {title}
                                    </span>
                                    {isBaseline && (
                                      <span className="rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-bold px-2 py-0.5">
                                        {t.currentRotationBadge}
                                      </span>
                                    )}
                                  </div>

                                  {/* Timeline pills */}
                                  <div className="flex items-center gap-1 flex-wrap text-xs">
                                    {ev.steps.map((st, idx) => (
                                      <div key={idx} className="flex items-center gap-1">
                                        <span className="inline-flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-lg text-neutral-800 font-medium text-[11px]">
                                          <span>{CROP_ICONS[st.crop.id] || "🌱"}</span>
                                          <span>{t.crops[st.crop.id] || st.crop.name}</span>
                                        </span>
                                        {idx < ev.steps.length - 1 && (
                                          <span className="text-neutral-400 font-bold text-[10px]">→</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Honesty Cross-Basis Note */}
                        <div className="rounded-xl bg-neutral-100 p-2.5 text-[10px] text-neutral-600 leading-relaxed">
                          {t.journoCrossBasisNote}
                        </div>

                        {/* Full Details in Expert Mode Link */}
                        <Link
                          href={`/expert?lat=${lat}&lon=${lon}&crops=${selectedCrops.join(",")}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-900 hover:text-black py-1 cursor-pointer"
                        >
                          <span>{t.journoFullDetailsLink}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Navigation buttons: Change Crop / Sowing & Start Over */}
              <div className="space-y-2 mt-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full min-h-[44px] rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-semibold text-xs py-2.5 px-4 transition active:scale-[0.98] flex items-center justify-center cursor-pointer"
                >
                  {t.journoChangeCropBtn}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full min-h-[40px] text-neutral-400 hover:text-neutral-700 font-medium text-xs py-2 transition flex items-center justify-center cursor-pointer"
                >
                  {t.journoStartOverBtn}
                </button>

                {/* Direct Link to Researcher Mode at the bottom of the result screen */}
                <Link
                  href={`/expert?lat=${lat}&lon=${lon}&crops=${selectedCrops.join(",")}`}
                  className="w-full min-h-[48px] rounded-2xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 font-bold text-xs py-3 px-4 transition active:scale-[0.98] flex items-center justify-center gap-2 border border-neutral-200/80 cursor-pointer mt-2"
                >
                  <span>{t.journoResearcherModeBtn}</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer & Persistent AI Chat Trigger */}
      <footer className="max-w-md mx-auto w-full flex items-center justify-between text-xs text-neutral-400 py-2">
        <span>Field Shift · Sri Lanka Dry Zone</span>
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="font-bold text-emerald-800 hover:text-emerald-950 transition flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 cursor-pointer"
        >
          <span>✨</span>
          <span>{t.needHelp}</span>
        </button>
      </footer>

      {/* Gemini AI Chat Sheet Modal */}
      <HelpSheet
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        lang={lang}
        screenId={
          step === 1
            ? "language_step"
            : step === 2
            ? "location_step"
            : step === 3
            ? "crop_selection_step"
            : step === 4
            ? "sowing_period_step"
            : "results_step"
        }
        staticHelpText={
          step === 5
            ? `For your sowing window (${t[activeSowingOption.labelKey]}), the top crop match is ${topMatch ? CROPS[topMatch.cropId]?.name : "selected crop"}. Other crops are ranked with specific water and risk considerations.`
            : `Select your crops and sowing period. Field Shift uses 11 years of NASA satellite observations and the Meteomatics weather model.`
        }
        screenContextText={getScreenContextText()}
      />
    </main>
  );
}
