"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageCode, TRANSLATIONS } from "@/data/translations";
import { CROPS } from "@/data/crops";
import { useNasaData } from "@/lib/hooks/useNasaData";
import { computeBestRainWindow } from "@/lib/engine/crop-window";
import { useMeteomaticsForecast } from "@/lib/hooks/useMeteomaticsForecast";
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
    if (lang === "ta") return "நவம்பர்";
    return "November";
  }
  if (seasonId === "maha") {
    if (lang === "si") return "ඔක්තෝබර්";
    if (lang === "ta") return "அக்டோபர்";
    return "October";
  }
  // Yala
  if (lang === "si") return "අප්‍රේල්";
  if (lang === "ta") return "ஏப்ரல்";
  return "April";
}

export default function Home() {
  const router = useRouter();

  // Wizard state: 1 (Language), 2 (Occupation), 3 (Location), 4 (Crop), 5 (Result)
  const [step, setStep] = useState<number>(1);
  const [lang, setLang] = useState<LanguageCode>("en");
  const [role, setRole] = useState<"farmer" | "researcher">("farmer");

  // Step 3: Location
  const [lat, setLat] = useState<number>(DEFAULT_PADAVIYA_LAT);
  const [lon, setLon] = useState<number>(DEFAULT_PADAVIYA_LON);
  const [locationName, setLocationName] = useState<string>("Padaviya (Dry Zone)");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Step 4: Chosen Crop (one of the 5 verified crops)
  const [selectedCrop, setSelectedCrop] = useState<typeof CROP_IDS[number]>("rice");

  // Step 5: See More panel toggle
  const [showSeeMore, setShowSeeMore] = useState<boolean>(false);

  // Help Sheet state
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Active translation dictionary
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // NASA Data hook
  const { data: climateData, loading: climateLoading, error: climateError } = useNasaData(lat, lon);

  // Supplementary Meteomatics Forecast hook (active on Step 5, hides if API fails/no data)
  const { forecast: meteoForecast } = useMeteomaticsForecast(
    lat,
    lon,
    climateData,
    step === 5
  );

  // Compute best rain-supported window
  const windowAnalysis = useMemo(
    () => computeBestRainWindow(selectedCrop, climateData),
    [selectedCrop, climateData]
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

  const strongest = windowAnalysis.strongestSeason;
  const coveragePercent =
    strongest.waterCoverageRatio !== null
      ? Math.round(strongest.waterCoverageRatio * 100)
      : null;

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
  const displaySeasonName =
    strongest.seasonId === "maha"
      ? lang === "si"
        ? "මහ කන්නය (Maha)"
        : lang === "ta"
        ? "பெரும்போகம் (Maha)"
        : "Maha Season"
      : lang === "si"
      ? "යල කන්නය (Yala)"
      : lang === "ta"
      ? "சிறுபோகம் (Yala)"
      : "Yala Season";

  // Context summary for Help LLM prompt
  const getScreenContextText = (): string => {
    return `Journo Redesign flow, Step ${step}. Language: ${lang}. Role: ${role}. Location: ${locationName} (${lat}°N, ${lon}°E). Selected crop: ${selectedCrop}. Strongest rain window: ${strongest.seasonName} (${strongest.sowingTimingText}), rain coverage: ${coveragePercent !== null ? coveragePercent + "%" : "unverified water requirement"}.`;
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
          {/* Progress Dots */}
          <div className="flex items-center justify-between mb-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors py-1.5 px-2 rounded-lg -ml-2 min-h-[44px] flex items-center"
              >
                {t.journoBackBtn}
              </button>
            ) : (
              <div className="w-12" />
            )}

            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
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
              {step}/5
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
                    className={`w-full min-h-[58px] p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all active:scale-[0.99] ${
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
                className="w-full min-h-[48px] rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-base py-3.5 px-6 shadow-sm transition active:scale-[0.98] flex items-center justify-center"
              >
                {t.journoContinueBtn}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              STEP 2: OCCUPATION (ROLE)
             ══════════════════════════════════════════ */}
          {step === 2 && (
            <div className="animate-in fade-in duration-200">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                {t.journoRoleTitle}
              </h1>
              <p className="text-sm text-neutral-500 font-medium mt-1 mb-6">
                {t.journoRoleSubtitle}
              </p>

              <div className="space-y-3 mb-8">
                {/* Farmer Option */}
                <button
                  type="button"
                  onClick={() => setRole("farmer")}
                  className={`w-full min-h-[72px] p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all active:scale-[0.99] ${
                    role === "farmer"
                      ? "border-black bg-neutral-50/80 shadow-2xs"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-3xl">🌾</span>
                    <div>
                      <div className="font-bold text-base text-neutral-900">
                        {t.journoRoleFarmer}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {t.journoRoleFarmerDesc}
                      </div>
                    </div>
                  </div>
                  {role === "farmer" && (
                    <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  )}
                </button>

                {/* Researcher Option */}
                <button
                  type="button"
                  onClick={() => setRole("researcher")}
                  className={`w-full min-h-[72px] p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all active:scale-[0.99] ${
                    role === "researcher"
                      ? "border-black bg-neutral-50/80 shadow-2xs"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-3xl">🔬</span>
                    <div>
                      <div className="font-bold text-base text-neutral-900">
                        {t.journoRoleResearcher}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {t.journoRoleResearcherDesc}
                      </div>
                    </div>
                  </div>
                  {role === "researcher" && (
                    <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  )}
                </button>
              </div>

              {/* Black Pill Next Button */}
              <button
                type="button"
                onClick={() => {
                  if (role === "researcher") {
                    router.push(`/expert?lat=${lat}&lon=${lon}`);
                  } else {
                    setStep(3);
                  }
                }}
                className="w-full min-h-[48px] rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-base py-3.5 px-6 shadow-sm transition active:scale-[0.98] flex items-center justify-center"
              >
                {t.journoContinueBtn}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              STEP 3: LOCATION
             ══════════════════════════════════════════ */}
          {step === 3 && (
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
                className="w-full min-h-[52px] rounded-2xl border-2 border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-900 font-bold text-base py-3 px-4 transition active:scale-[0.99] flex items-center justify-center gap-2 mb-4"
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
                onClick={() => setStep(4)}
                className="w-full min-h-[48px] rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-base py-3.5 px-6 shadow-sm transition active:scale-[0.98] flex items-center justify-center"
              >
                {t.journoContinueBtn}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              STEP 4: CROP SELECTION (ONLY 5 VERIFIED CROPS)
             ══════════════════════════════════════════ */}
          {step === 4 && (
            <div className="animate-in fade-in duration-200">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                {t.journoCropTitle}
              </h1>
              <p className="text-sm text-neutral-500 font-medium mt-1 mb-6">
                {t.journoCropSubtitle}
              </p>

              {/* Crop Picker List */}
              <div className="space-y-2.5 mb-8">
                {CROP_IDS.map((cId) => {
                  const cropName = t.crops[cId] || CROPS[cId].name;
                  const isSelected = selectedCrop === cId;
                  const icon =
                    cId === "rice"
                      ? "🌾"
                      : cId === "green_gram"
                      ? "🌱"
                      : cId === "cowpea"
                      ? "🥜"
                      : cId === "black_gram"
                      ? "🌿"
                      : "🌽";

                  return (
                    <button
                      key={cId}
                      type="button"
                      onClick={() => setSelectedCrop(cId)}
                      className={`w-full min-h-[54px] p-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition-all active:scale-[0.99] ${
                        isSelected
                          ? "border-black bg-neutral-50 font-bold text-neutral-900 shadow-2xs"
                          : "border-neutral-200 hover:border-neutral-300 bg-white font-medium text-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{icon}</span>
                        <span className="text-base">{cropName}</span>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Black Pill Next Button */}
              <button
                type="button"
                onClick={() => setStep(5)}
                className="w-full min-h-[48px] rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-base py-3.5 px-6 shadow-sm transition active:scale-[0.98] flex items-center justify-center"
              >
                {t.journoContinueBtn}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              STEP 5: RESULT SCREEN ("Rain-supported window")
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
                    onClick={() => setStep(3)}
                    className="mt-2 min-h-[48px] rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-semibold px-6 py-3 transition active:scale-[0.98] inline-flex items-center gap-1.5"
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
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      {t.journoStrongestSeason}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                      {t.journoRainHeader}
                    </h1>
                    <p className="text-xs text-neutral-400 font-medium mt-0.5">
                      {locationName} · {t.crops[selectedCrop] || CROPS[selectedCrop].name}
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

                  {/* Core Hero Result Box */}
                  <div className="rounded-2xl bg-neutral-900 text-white p-5 my-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        {displaySeasonName}
                      </span>
                      {strongest.isUnverifiedWaterNeed && (
                        <span className="rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 border border-amber-500/30">
                          {t.partialBadge}
                        </span>
                      )}
                    </div>

                    {/* Big Number / Unverified Data Display */}
                    <div>
                      {strongest.isUnverifiedWaterNeed ? (
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
                            {coveragePercent}%
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-neutral-300">
                            {t.waterCoveragePlain(coveragePercent ?? 0)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Simple Sowing Timing Line (Month range only) */}
                    <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">
                        {t.sowAround(getSowingMonthRange(selectedCrop, strongest.seasonId, lang))}
                      </span>
                    </div>

                    {/* Ignores Irrigation Line */}
                    <p className="text-[11px] text-neutral-400 italic pt-1 border-t border-neutral-800/60">
                      {t.journoIgnoresIrrigation}
                    </p>
                  </div>

                  {/* Honesty Items */}
                  <div className="space-y-2 mb-6">
                    {/* Rice cross-basis note */}
                    {selectedCrop === "rice" && (
                      <p className="text-[11px] text-neutral-500 bg-neutral-100 p-2.5 rounded-xl leading-relaxed">
                        {t.journoCrossBasisNote}
                      </p>
                    )}

                    {/* General Disclaimer */}
                    <p className="text-[11px] text-neutral-400 leading-relaxed text-center">
                      {t.journoHonestyAdvice}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {/* See More Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setShowSeeMore((prev) => !prev)}
                      className="w-full min-h-[48px] rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-sm py-3 px-6 shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                      <span>{showSeeMore ? t.journoSeeMoreCloseBtn : t.journoSeeMoreBtn}</span>
                      <span>{showSeeMore ? "↑" : "↓"}</span>
                    </button>

                    {/* Expanded "See more" Fact Sheet & Forecast Section */}
                    {showSeeMore && (
                      <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-3 animate-in fade-in duration-200 mt-2">
                        {/* Supplementary Meteomatics Forecast Line (hidden if API fails or no data) */}
                        {meteoForecast && (
                          <div className="rounded-xl border border-neutral-200 bg-white p-3.5 space-y-1.5 shadow-2xs">
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

                        {/* Both Seasons Rainfall Breakdown (Contains class/week sowing details) */}
                        <div className="rounded-xl border border-neutral-200 bg-white p-3.5 space-y-2 text-xs">
                          <div className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">
                            Seasonal Sowing Windows ({t.crops[selectedCrop] || CROPS[selectedCrop].name})
                          </div>

                          {/* Maha */}
                          <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 gap-2">
                            <div>
                              <span className="font-bold text-neutral-900 block">Maha Season</span>
                              <span className="text-neutral-500 text-[11px] block">
                                Sowing: ~{windowAnalysis.maha.sowingStartDay}{" "}
                                {windowAnalysis.maha.sowingStartMonth === 10
                                  ? "Oct"
                                  : windowAnalysis.maha.sowingStartMonth === 11
                                  ? "Nov"
                                  : "Apr"}{" "}
                                <span className="text-neutral-600 font-medium">({windowAnalysis.maha.sowingTimingText})</span>
                              </span>
                            </div>
                            <span className="font-extrabold text-neutral-900 text-right shrink-0">
                              {windowAnalysis.maha.waterCoverageRatio !== null
                                ? `${Math.round(windowAnalysis.maha.waterCoverageRatio * 100)}%`
                                : `~${windowAnalysis.maha.windowRainfallMm ?? "—"} mm`}
                            </span>
                          </div>

                          {/* Yala */}
                          <div className="flex items-center justify-between py-1.5 gap-2">
                            <div>
                              <span className="font-bold text-neutral-900 block">Yala Season</span>
                              <span className="text-neutral-500 text-[11px] block">
                                Sowing: ~{windowAnalysis.yala.sowingStartDay} Apr{" "}
                                <span className="text-neutral-600 font-medium">({windowAnalysis.yala.sowingTimingText})</span>
                              </span>
                            </div>
                            <span className="font-extrabold text-neutral-900 text-right shrink-0">
                              {windowAnalysis.yala.waterCoverageRatio !== null
                                ? `${Math.round(windowAnalysis.yala.waterCoverageRatio * 100)}%`
                                : `~${windowAnalysis.yala.windowRainfallMm ?? "—"} mm`}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Navigation buttons: Change Crop & Start Over */}
              <div className="space-y-2 mt-3">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full min-h-[44px] rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-semibold text-xs py-2.5 px-4 transition active:scale-[0.98] flex items-center justify-center"
                >
                  {t.journoChangeCropBtn}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full min-h-[40px] text-neutral-400 hover:text-neutral-700 font-medium text-xs py-2 transition flex items-center justify-center"
                >
                  {t.journoStartOverBtn}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer & Persistent Help Trigger */}
      <footer className="max-w-md mx-auto w-full flex items-center justify-between text-xs text-neutral-400 py-2">
        <span>Field Shift · Sri Lanka Dry Zone</span>
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="font-semibold text-neutral-700 hover:text-black transition flex items-center gap-1"
        >
          <span>💬</span>
          <span>{t.needHelp}</span>
        </button>
      </footer>

      {/* Help Sheet Modal */}
      <HelpSheet
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        lang={lang}
        screenId="rain_supported_window"
        staticHelpText={
          selectedCrop === "rice"
            ? "Rice water requirement (948–1,232 mm, DOA Mahailluppallama) includes land puddling and standing water. Maha Northeast monsoon rains cover a substantial portion (~74%), whereas Yala requires extensive tank irrigation."
            : selectedCrop === "green_gram"
            ? "Green gram water use (228 mm Maha / 270 mm Yala, Annals DOA 2014) is well supported by Maha rains, and is a strong soil-enriching legume alternative."
            : selectedCrop === "cowpea"
            ? "Cowpea water use (175–288 mm, Liyanage 1992) is drought tolerant. Sowing in mid-October or mid-April avoids excess vegetative waterlogging."
            : "Maize and Black Gram water requirements in mm are unverified in reviewed Sri Lanka Dry Zone literature; seasonal rainfall is reported for reference."
        }
        screenContextText={getScreenContextText()}
      />
    </main>
  );
}
