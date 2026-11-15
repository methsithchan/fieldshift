"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageCode, TRANSLATIONS } from "@/data/translations";
import { CROPS } from "@/data/crops";
import { useNasaData } from "@/lib/hooks/useNasaData";
import { computeCropSeasonWindow, computeBestRainWindow } from "@/lib/engine/crop-window";
import { useMeteomaticsForecast } from "@/lib/hooks/useMeteomaticsForecast";
import { buildFarmerScenarios } from "@/lib/engine/farmer-strategies";
import { evaluateAllScenarios } from "@/lib/engine/rotation";
import { SoilFormState, PriorityWeights } from "@/lib/types/engine";
import { CLIMATE_HAZARD_ADVICE } from "@/data/crop_sourcing";
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

// Geographic boundaries for Sri Lanka and Dry Zone
const SRI_LANKA_BOX = { latMin: 5.8, latMax: 10.0, lonMin: 79.5, lonMax: 82.0 };
const DRY_ZONE_BOX = { latMin: 7.0, latMax: 10.0, lonMin: 79.5, lonMax: 81.5 };

function getSowingMonthRange(
  cropId: typeof CROP_IDS[number],
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
    if (lang === "ta") return "நවம்பர்";
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

const CROP_ICONS: Record<string, string> = {
  rice: "🌾",
  green_gram: "🌱",
  cowpea: "🥜",
  black_gram: "🌿",
  maize: "🌽",
};

export default function Home() {
  const router = useRouter();

  // Wizard state: 1 (Language), 2 (Location), 3 (Crops), 4 (Result Screen)
  const [step, setStep] = useState<number>(1);
  const [lang, setLang] = useState<LanguageCode>("en");

  // Step 2: Location
  const [lat, setLat] = useState<number>(DEFAULT_PADAVIYA_LAT);
  const [lon, setLon] = useState<number>(DEFAULT_PADAVIYA_LON);
  const [locationName, setLocationName] = useState<string>("Padaviya (Dry Zone)");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Step 3: Dual-Season Crop Selection
  const [mahaCrop, setMahaCrop] = useState<typeof CROP_IDS[number]>("rice");
  const [yalaCrop, setYalaCrop] = useState<typeof CROP_IDS[number]>("rice");
  const [yalaTouched, setYalaTouched] = useState<boolean>(false);

  // Step 4: Hero Season Switcher (defaults to "maha")
  const [activeSeason, setActiveSeason] = useState<"maha" | "yala">("maha");

  // See More panel toggle
  const [showSeeMore, setShowSeeMore] = useState<boolean>(false);

  // Help Sheet state
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Active translation dictionary
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // NASA Data hook
  const { data: climateData, loading: climateLoading, error: climateError } = useNasaData(lat, lon);

  // Supplementary Meteomatics Forecast hook (active on Result step, hides if API fails/no data)
  const { forecast: meteoForecast } = useMeteomaticsForecast(
    lat,
    lon,
    climateData,
    step === 4
  );

  // Single-crop assumption check: true if user selected the same crop in both seasons
  const isSingleCrop = mahaCrop === yalaCrop;

  // Handlers for crop dropdowns
  const handleMahaChange = (c: typeof CROP_IDS[number]) => {
    setMahaCrop(c);
    if (!yalaTouched) {
      setYalaCrop(c); // Default Yala = same as Maha unless user has manually customized Yala
    }
  };

  const handleYalaChange = (c: typeof CROP_IDS[number]) => {
    setYalaCrop(c);
    setYalaTouched(true);
  };

  // Compute Active Season Rain Window for Hero
  const activeCrop = activeSeason === "maha" ? mahaCrop : yalaCrop;
  const activeWindow = useMemo(
    () => computeCropSeasonWindow(activeCrop, activeSeason, climateData),
    [activeCrop, activeSeason, climateData]
  );

  const activeCoveragePercent =
    activeWindow.waterCoverageRatio !== null
      ? Math.round(activeWindow.waterCoverageRatio * 100)
      : null;

  // Detailed Maha and Yala windows for Seasonal Sowing Windows card
  const mahaWindow = useMemo(
    () => computeCropSeasonWindow(mahaCrop, "maha", climateData),
    [mahaCrop, climateData]
  );
  const yalaWindow = useMemo(
    () => computeCropSeasonWindow(yalaCrop, "yala", climateData),
    [yalaCrop, climateData]
  );

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

  // Three strategies evaluation
  const scenarios = useMemo(
    () => buildFarmerScenarios(mahaCrop, yalaCrop, []),
    [mahaCrop, yalaCrop]
  );

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

  // Localized Active Season Name
  const displayActiveSeasonName =
    activeSeason === "maha" ? t.journoMahaSeasonLabel : t.journoYalaSeasonLabel;

  // Context summary for Help LLM prompt
  const getScreenContextText = (): string => {
    return `Field Shift Farmer Wizard.
Language: ${lang}.
Location: ${locationName} (${lat}°N, ${lon}°E).
In Maha farmer grows: ${CROPS[mahaCrop]?.name || mahaCrop}.
In Yala farmer grows: ${CROPS[yalaCrop]?.name || yalaCrop}.
Active viewing season: ${activeSeason} (${displayActiveSeasonName}).
Active window: ${activeWindow.sowingTimingText}, rainfall: ${activeWindow.windowRainfallMm} mm, water need: ${activeWindow.cropWaterNeedMm ?? "unverified"} mm.
Coverage: ${activeCoveragePercent !== null ? activeCoveragePercent + "%" : "unverified water need"}.
NASA POWER 11-Year Climatology for location:
- Maha rainfall: ${climateData?.seasonalSummary.mahaRainfallMm ?? "N/A"} mm, Mean temp: ${climateData?.seasonalSummary.mahaAvgTempC ?? "N/A"}°C, Root-zone soil wetness: ${climateData?.seasonalSummary.mahaAvgSoilWetness ?? "N/A"}
- Yala rainfall: ${climateData?.seasonalSummary.yalaRainfallMm ?? "N/A"} mm, Mean temp: ${climateData?.seasonalSummary.yalaAvgTempC ?? "N/A"}°C, Root-zone soil wetness: ${climateData?.seasonalSummary.yalaAvgSoilWetness ?? "N/A"}
- Annual total rainfall: ${climateData?.seasonalSummary.annualRainfallMm ?? "N/A"} mm
Meteomatics 7-day model forecast: ${meteoForecast ? `${meteoForecast.next7DaysMm} mm` : "forecast pending or unavailable"}.
Rotation Strategies:
- Strategy A: Current baseline (${evaluations[0]?.steps.map((s) => s.crop.id).join(" -> ")})
- Strategy B: Legume integration (${evaluations[1]?.steps.map((s) => s.crop.id).join(" -> ")})
- Strategy C: Diversified rotation (${evaluations[2]?.steps.map((s) => s.crop.id).join(" -> ")})`;
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

        {/* Quick Language Toggle Pill */}
        <div className="flex items-center rounded-full bg-neutral-200/80 p-0.5 text-xs font-semibold text-neutral-800">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`min-h-[32px] px-2.5 rounded-full transition-all ${
              lang === "en" ? "bg-white text-neutral-950 shadow-xs" : "hover:text-neutral-900"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang("si")}
            className={`min-h-[32px] px-2.5 rounded-full transition-all ${
              lang === "si" ? "bg-white text-neutral-950 shadow-xs" : "hover:text-neutral-900"
            }`}
          >
            සිං
          </button>
          <button
            type="button"
            onClick={() => setLang("ta")}
            className={`min-h-[32px] px-2.5 rounded-full transition-all ${
              lang === "ta" ? "bg-white text-neutral-950 shadow-xs" : "hover:text-neutral-900"
            }`}
          >
            த
          </button>
        </div>
      </header>

      {/* Main Single Card Area */}
      <div className="max-w-md mx-auto w-full my-auto py-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-neutral-200/80 transition-all">
          {/* Progress Dots: 4 Steps (Language, Location, Crops, Result) */}
          <div className="flex items-center justify-between mb-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors py-1.5 px-2 rounded-lg -ml-2 min-h-[44px] flex items-center cursor-pointer"
              >
                {t.journoBackBtn}
              </button>
            ) : (
              <div className="w-12" />
            )}

            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    s === step
                      ? "w-6 bg-black"
                      : s < step
                      ? "w-2 bg-neutral-400"
                      : "w-2 bg-neutral-200"
                  }`}
                />
              ))}
            </div>

            <span className="text-[11px] font-semibold text-neutral-400">
              {step}/4
            </span>
          </div>

          {/* ══════════════════════════════════════════
              STEP 1: LANGUAGE
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
                {[
                  { code: "en", label: "English", sub: "English Language", flag: "🇬🇧" },
                  { code: "si", label: "සිංහල", sub: "Sinhala Language", flag: "🇱🇰" },
                  { code: "ta", label: "தமிழ்", sub: "Tamil Language", flag: "🇱🇰" },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLang(item.code as LanguageCode)}
                    className={`w-full min-h-[58px] p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer ${
                      lang === item.code
                        ? "border-black bg-neutral-50/80 shadow-2xs"
                        : "border-neutral-200 hover:border-neutral-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.flag}</span>
                      <div>
                        <div className="font-bold text-base text-neutral-900 leading-snug">
                          {item.label}
                        </div>
                        <div className="text-xs text-neutral-500">{item.sub}</div>
                      </div>
                    </div>
                    {lang === item.code && (
                      <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
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

              {/* Use My Location Primary Button */}
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="w-full min-h-[52px] rounded-2xl border-2 border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-900 font-bold text-base py-3 px-4 transition active:scale-[0.99] flex items-center justify-center gap-2 mb-4 cursor-pointer"
              >
                {isLocating ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
                    <span>{t.journoLocating}</span>
                  </>
                ) : (
                  <span>{t.journoUseMyLocation}</span>
                )}
              </button>

              {locError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 mb-4">
                  {locError}
                </div>
              )}

              {/* Preset Area Dropdown */}
              <div className="space-y-1.5 mb-5">
                <label
                  htmlFor="locationPreset"
                  className="block text-xs font-bold text-neutral-700 uppercase tracking-wider"
                >
                  {t.journoOrSelectArea}
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
                  className="w-full min-h-[50px] rounded-2xl border-2 border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-900 focus:border-black focus:outline-hidden"
                >
                  {LOCATION_PRESETS.map((p) => (
                    <option key={p.name} value={`${p.lat},${p.lon}`}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Selection Chip */}
              <div className="rounded-2xl bg-neutral-100/70 p-3.5 flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                    {t.selectedLocation}
                  </div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {locationName}
                  </div>
                </div>
                <span className="text-xl">📍</span>
              </div>

              {/* Privacy Notice Line */}
              <p className="text-xs text-neutral-400 font-medium leading-relaxed mb-8">
                {t.journoNotStoredNote}
              </p>

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
              STEP 3: CROP SELECTION (MAHA & YALA DROPDOWNS)
             ══════════════════════════════════════════ */}
          {step === 3 && (
            <div className="animate-in fade-in duration-200">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                {t.journoCropTitle}
              </h1>
              <p className="text-sm text-neutral-500 font-medium mt-1 mb-6">
                {t.journoCropSubtitle}
              </p>

              <div className="space-y-5 mb-8">
                {/* Maha Crop Dropdown */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="mahaCropSelect"
                    className="block text-xs font-bold text-neutral-800 uppercase tracking-wider"
                  >
                    🌧️ {t.journoInMahaLabel}
                  </label>
                  <select
                    id="mahaCropSelect"
                    value={mahaCrop}
                    onChange={(e) => handleMahaChange(e.target.value as typeof CROP_IDS[number])}
                    className="w-full min-h-[52px] rounded-2xl border-2 border-neutral-300 bg-white px-4 py-3 text-sm font-bold text-neutral-900 focus:border-black focus:outline-hidden"
                  >
                    {CROP_IDS.map((cId) => (
                      <option key={cId} value={cId}>
                        {CROP_ICONS[cId]} {t.crops[cId] || CROPS[cId].name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Yala Crop Dropdown */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="yalaCropSelect"
                    className="block text-xs font-bold text-neutral-800 uppercase tracking-wider"
                  >
                    ☀️ {t.journoInYalaLabel}
                  </label>
                  <select
                    id="yalaCropSelect"
                    value={yalaCrop}
                    onChange={(e) => handleYalaChange(e.target.value as typeof CROP_IDS[number])}
                    className="w-full min-h-[52px] rounded-2xl border-2 border-neutral-300 bg-white px-4 py-3 text-sm font-bold text-neutral-900 focus:border-black focus:outline-hidden"
                  >
                    {CROP_IDS.map((cId) => (
                      <option key={cId} value={cId}>
                        {CROP_ICONS[cId]} {t.crops[cId] || CROPS[cId].name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Single crop assumption info chip */}
                {isSingleCrop && (
                  <div className="rounded-xl bg-neutral-100 p-3 text-xs text-neutral-600 leading-relaxed border border-neutral-200/60">
                    ℹ️ {t.journoSingleCropAssumption}
                  </div>
                )}
              </div>

              {/* Black Pill Next Button */}
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-full min-h-[48px] rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-base py-3.5 px-6 shadow-sm transition active:scale-[0.98] flex items-center justify-center cursor-pointer"
              >
                {t.journoContinueBtn}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              STEP 4: RESULT SCREEN ("Rain-supported window" & See More)
             ══════════════════════════════════════════ */}
          {step === 4 && (
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
                  {/* Warning banner if inside Sri Lanka but outside approximate Dry Zone */}
                  {isOutsideDryZone && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 mb-4 leading-relaxed">
                      {t.outsideDryZoneWarning}
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      {t.journoStrongestSeason}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                      {t.journoRainHeader}
                    </h1>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">
                      {locationName} · {displayActiveSeasonName}
                    </p>
                  </div>

                  {/* Season Switcher Tabs */}
                  <div className="flex rounded-2xl bg-neutral-100 p-1 mb-4 text-xs font-bold text-neutral-700">
                    <button
                      type="button"
                      onClick={() => setActiveSeason("maha")}
                      className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeSeason === "maha"
                          ? "bg-white text-black shadow-xs font-extrabold"
                          : "hover:text-black"
                      }`}
                    >
                      <span>🌧️ {t.journoMahaSeasonLabel}:</span>
                      <span>{t.crops[mahaCrop] || CROPS[mahaCrop].name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSeason("yala")}
                      className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeSeason === "yala"
                          ? "bg-white text-black shadow-xs font-extrabold"
                          : "hover:text-black"
                      }`}
                    >
                      <span>☀️ {t.journoYalaSeasonLabel}:</span>
                      <span>{t.crops[yalaCrop] || CROPS[yalaCrop].name}</span>
                    </button>
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

                  {/* Core Hero Result Box */}
                  <div className="rounded-2xl bg-neutral-900 text-white p-5 my-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        {displayActiveSeasonName} ({t.crops[activeCrop] || CROPS[activeCrop].name})
                      </span>
                      {activeWindow.isUnverifiedWaterNeed && (
                        <span className="rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 border border-amber-500/30">
                          {t.partialBadge}
                        </span>
                      )}
                    </div>

                    {/* Big Number / Unverified Data Display */}
                    <div>
                      {activeWindow.isUnverifiedWaterNeed ? (
                        <div className="space-y-1">
                          <div className="text-lg sm:text-xl font-bold text-white leading-snug">
                            {t.noRainfallDataForCrop}
                          </div>
                          <p className="text-xs text-neutral-400">
                            {t.noRainfallDataDesc}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                            {activeCoveragePercent}%
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-neutral-300">
                            {t.waterCoveragePlain(activeCoveragePercent ?? 0)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Simple Sowing Timing Line (Month range only) */}
                    <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">
                        {t.sowAround(getSowingMonthRange(activeCrop, activeSeason, lang))}
                      </span>
                    </div>

                    {/* Ignores Irrigation Line */}
                    <p className="text-[11px] text-neutral-400 italic pt-1 border-t border-neutral-800/60">
                      {t.journoIgnoresIrrigation}
                    </p>
                  </div>

                  {/* Seasonal Climate & Soil Moisture Indicators Card */}
                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3 mb-4 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-800 uppercase tracking-wider">
                      <span>📊 {t.journoClimateIndicatorsTitle}</span>
                      <span className="text-[10px] text-neutral-400 font-normal">NASA POWER (11-Year)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Soil Wetness Indicator */}
                      <div className="rounded-xl bg-neutral-50 p-2.5 border border-neutral-100">
                        <span className="text-[11px] font-semibold text-neutral-500 block">
                          💧 {t.journoSoilWetnessLabel}
                        </span>
                        <div className="mt-1 font-extrabold text-neutral-900 text-sm">
                          Maha: {climateData?.seasonalSummary.mahaAvgSoilWetness ?? "0.60"}
                          <span className="text-[10px] text-neutral-400 font-normal"> / 1.0</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          Yala: {climateData?.seasonalSummary.yalaAvgSoilWetness ?? "0.38"} / 1.0
                        </div>
                      </div>

                      {/* Temperature Indicator */}
                      <div className="rounded-xl bg-neutral-50 p-2.5 border border-neutral-100">
                        <span className="text-[11px] font-semibold text-neutral-500 block">
                          🌡️ {t.journoAvgTempLabel}
                        </span>
                        <div className="mt-1 font-extrabold text-neutral-900 text-sm">
                          Maha: {climateData?.seasonalSummary.mahaAvgTempC ?? "27"}°C
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          Yala: {climateData?.seasonalSummary.yalaAvgTempC ?? "29"}°C
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Honesty Advice */}
                  <p className="text-[11px] text-neutral-400 leading-relaxed text-center mb-4">
                    {t.journoHonestyAdvice}
                  </p>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* See More Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setShowSeeMore((prev) => !prev)}
                      className="w-full min-h-[48px] rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-sm py-3 px-6 shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{showSeeMore ? t.journoSeeMoreCloseBtn : t.journoSeeMoreBtn}</span>
                      <span>{showSeeMore ? "↑" : "↓"}</span>
                    </button>

                    {/* Expanded "See more" Fact Sheet & 3-Strategy Comparison */}
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

                        {/* Seasonal Sowing Windows Card */}
                        <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-2.5 text-xs shadow-2xs">
                          <div className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">
                            {t.journoSeasonalSowingWindows}
                          </div>

                          {/* Maha Sowing Timing */}
                          <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 gap-2">
                            <div>
                              <span className="font-bold text-neutral-900 block">
                                {t.journoMahaSeasonLabel} ({t.crops[mahaCrop] || CROPS[mahaCrop].name})
                              </span>
                              <span className="text-neutral-500 text-[11px] block">
                                {t.journoSowingLabel} ~{mahaWindow.sowingStartDay} {t.months[mahaWindow.sowingStartMonth] || "Nov"}{" "}
                                <span className="text-neutral-600 font-medium">({mahaWindow.sowingTimingText})</span>
                              </span>
                            </div>
                            <span className="font-extrabold text-neutral-900 text-right shrink-0">
                              {mahaWindow.waterCoverageRatio !== null
                                ? `${Math.round(mahaWindow.waterCoverageRatio * 100)}%`
                                : `~${mahaWindow.windowRainfallMm ?? "—"} mm`}
                            </span>
                          </div>

                          {/* Yala Sowing Timing */}
                          <div className="flex items-center justify-between py-1.5 gap-2">
                            <div>
                              <span className="font-bold text-neutral-900 block">
                                {t.journoYalaSeasonLabel} ({t.crops[yalaCrop] || CROPS[yalaCrop].name})
                              </span>
                              <span className="text-neutral-500 text-[11px] block">
                                {t.journoSowingLabel} ~{yalaWindow.sowingStartDay} {t.months[4] || "Apr"}{" "}
                                <span className="text-neutral-600 font-medium">({yalaWindow.sowingTimingText})</span>
                              </span>
                            </div>
                            <span className="font-extrabold text-neutral-900 text-right shrink-0">
                              {yalaWindow.waterCoverageRatio !== null
                                ? `${Math.round(yalaWindow.waterCoverageRatio * 100)}%`
                                : `~${yalaWindow.windowRainfallMm ?? "—"} mm`}
                            </span>
                          </div>
                        </div>

                        {/* ──────────────────────────────────────────────────────────
                            THREE-STRATEGY COMPARISON (Strategy A, B, C)
                           ────────────────────────────────────────────────────────── */}
                        <div className="space-y-3 pt-1">
                          <div className="border-b border-neutral-200 pb-2">
                            <h2 className="text-base font-extrabold text-neutral-900">
                              {t.journoCompareRotationsTitle}
                            </h2>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              {t.journoCompareRotationsSubtitle}
                            </p>
                          </div>

                          {evaluations.map((ev) => {
                            const isStrategyA = ev.id === "A";
                            const cardTitle =
                              isStrategyA
                                ? t.journoStrategyATitle
                                : ev.id === "B"
                                ? t.journoStrategyBTitle
                                : t.journoStrategyCTitle;

                            // Unique crops in this strategy for hazard advice lookups
                            const uniqueCropIds = Array.from(new Set(ev.steps.map((s) => s.crop.id)));
                            const hazardAdviceList = CLIMATE_HAZARD_ADVICE.filter((h) =>
                              uniqueCropIds.includes(h.cropId)
                            );

                            return (
                              <div
                                key={ev.id}
                                className={`rounded-2xl border bg-white p-4 space-y-3 text-xs shadow-2xs ${
                                  isStrategyA ? "border-neutral-300 ring-1 ring-neutral-200" : "border-neutral-200"
                                }`}
                              >
                                {/* Card Title & Baseline Badge */}
                                <div className="flex items-center justify-between">
                                  <h3 className="font-extrabold text-neutral-900 text-sm">
                                    {cardTitle}
                                  </h3>
                                  {isStrategyA && (
                                    <span className="rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-bold px-2 py-0.5">
                                      {t.currentRotationBadge}
                                    </span>
                                  )}
                                </div>

                                {/* Single crop assumption note for Strategy A */}
                                {isStrategyA && isSingleCrop && (
                                  <div className="text-[11px] text-neutral-600 bg-neutral-100/90 p-2 rounded-xl border border-neutral-200/50">
                                    ℹ️ {t.journoSingleCropAssumption}
                                  </div>
                                )}

                                {/* 3-Season Timeline */}
                                <div className="space-y-1">
                                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                                    {t.journoTimelineLabel}
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {ev.steps.map((st, sIdx) => (
                                      <div key={sIdx} className="flex items-center gap-1">
                                        <span className="inline-flex items-center gap-1 bg-neutral-100 px-2.5 py-1 rounded-lg text-neutral-800 font-semibold text-xs">
                                          <span>{CROP_ICONS[st.crop.id] || "🌱"}</span>
                                          <span>{t.crops[st.crop.id] || st.crop.name}</span>
                                        </span>
                                        {sIdx < ev.steps.length - 1 && (
                                          <span className="text-neutral-400 font-bold">→</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Seasonal Rainfall Coverage in Words */}
                                <div className="space-y-1.5 pt-1 border-t border-neutral-100">
                                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                                    {t.rainfallSummaryLabel}
                                  </span>
                                  <div className="space-y-1.5">
                                    {ev.steps.map((st, sIdx) => {
                                      const cropName = t.crops[st.crop.id] || st.crop.name;
                                      const pct = st.waterCoverageRatio !== null ? Math.round(st.waterCoverageRatio * 100) : null;
                                      const isUnverified = st.cropWaterNeedMidpointMm === null;
                                      return (
                                        <div key={sIdx} className="text-neutral-700 text-[11px] leading-relaxed">
                                          • {t.journoSeasonRainfallWords(st.seasonName, cropName, st.windowRainfallMm ?? 0, pct)}
                                          {isUnverified && (
                                            <span className="ml-1 rounded-md bg-amber-500/15 text-amber-800 text-[10px] font-bold px-1.5 py-0.5">
                                              {t.partialBadge}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Agronomic Risks / Considerations */}
                                {ev.risks.length > 0 && (
                                  <div className="space-y-1 pt-1 border-t border-neutral-100">
                                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                                      ⚠️ {t.journoRisksTitle}
                                    </span>
                                    <ul className="space-y-1 text-neutral-700 text-[11px]">
                                      {ev.risks.map((risk, rIdx) => (
                                        <li key={rIdx}>• {risk}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Data Gaps */}
                                {ev.dataGaps.length > 0 && (
                                  <div className="space-y-1 pt-1 border-t border-neutral-100">
                                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                                      📋 {t.journoDataGapsTitle}
                                    </span>
                                    <ul className="space-y-1 text-neutral-600 text-[11px]">
                                      {ev.dataGaps.map((gap, gIdx) => (
                                        <li key={gIdx}>• {gap}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Climate Hazard Advice (Book Advice Grounding) */}
                                {hazardAdviceList.length > 0 && (
                                  <div className="space-y-1 pt-1 border-t border-neutral-100">
                                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                                      📖 {t.climateHazardAdvice}
                                    </span>
                                    <div className="space-y-1">
                                      {hazardAdviceList.slice(0, 3).map((hz, hIdx) => (
                                        <div key={hIdx} className="text-[11px] text-neutral-700 bg-neutral-50 p-2 rounded-xl">
                                          <span className="font-bold text-neutral-900">
                                            {t.crops[hz.cropId] || CROPS[hz.cropId]?.name} ({hz.label}):
                                          </span>{" "}
                                          <span>{hz.advice}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Honesty Cross-Basis Note */}
                          <div className="rounded-xl bg-neutral-100 p-3 text-[11px] text-neutral-600 leading-relaxed">
                            {t.journoCrossBasisNote}
                          </div>

                          {/* Full Details in Expert Mode Link */}
                          <Link
                            href={`/expert?lat=${lat}&lon=${lon}&maha=${mahaCrop}&yala=${yalaCrop}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-900 hover:text-black py-2 cursor-pointer"
                          >
                            <span>{t.journoFullDetailsLink}</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Navigation buttons: Change Crop & Start Over */}
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
                  href={`/expert?lat=${lat}&lon=${lon}&maha=${mahaCrop}&yala=${yalaCrop}`}
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
            : "results_step"
        }
        staticHelpText={
          step === 4
            ? `Your current rotation is ${CROPS[mahaCrop]?.name} in Maha and ${CROPS[yalaCrop]?.name} in Yala. Maha rainfall covers the seasonal water need well for legumes, whereas rice requires extensive supplemental irrigation in Yala.`
            : `Select your district or current farm location. Field Shift uses 11 years of NASA satellite observations and the Meteomatics weather model.`
        }
        screenContextText={getScreenContextText()}
      />
    </main>
  );
}
