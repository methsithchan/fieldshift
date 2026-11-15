/**
 * Sourced agronomic data from Department of Agriculture Crop Book (DOA Sri Lanka).
 *
 * RIGOROUS INCLUSION RULES:
 * - fertilizer_schedule.csv is strictly EXCLUDED.
 * - Seed rates and chemical dosages are strictly EXCLUDED.
 * - Fruit, vegetable, root, and leafy files are strictly EXCLUDED.
 * - source_page is preserved for every single entry.
 */

export interface CropSowingTiming {
  cropId: string;
  seasonId: "maha" | "yala";
  operation: string;
  approxTiming: string;
  startMonth: number; // 1-12 (10=Oct, 11=Nov, 4=Apr)
  startDay: number; // 1-31 (sowing start offset day within month)
  durationDays?: number; // Override duration if specific to season/class (e.g. Rice Maha 3.5 mo = 105 d)
  sourcePage: number;
  confidence: "approximate (read from icon positions)" | "assumed fallback - no timing in source";
}

export interface ClimateHazardAdvice {
  cropId: string;
  hazard: "drought" | "excess_rain";
  label: string; // "If it is dry" | "If it is very wet"
  advice: string;
  sourcePage: number;
}

export interface HistoricCropBudget {
  cropId: string;
  sourcePage: number;
  scenario: string;
  priceYear: number;
  totalCostRsPerAcre: number;
  yieldPerAcre: string; // e.g. "2,152 kg" or "1,376 kg" or "2,000 kg"
  priceRsPerUnit: number;
  grossIncomeRsPerAcre: number;
  netProfitRsPerAcre: number;
  notes?: string;
}

export interface DistrictRecommendation {
  cropId: string;
  sourcePage: number;
  district: string;
  zoneType: "dry" | "intermediate";
  recommendedAllZones: boolean;
  notes?: string;
}

/**
 * 1. SOWING TIMINGS (from operations_timeline.csv)
 * Used to set the start month and day-of-month offset for crop growth windows.
 * Where no timing exists (Rice in Yala), marked as assumed fallback.
 */
export const OPERATIONS_TIMELINE_SOWING: CropSowingTiming[] = [
  {
    cropId: "rice",
    seasonId: "maha",
    operation: "sowing or nursery",
    approxTiming: "Nov (2.5 & 3 mo); 3.5 mo nursery Oct wk3-4",
    startMonth: 10,
    startDay: 22, // Sowing / nursery establishment begins ~22 Oct (Oct wk3-4) for default 3.5 mo class
    durationDays: 105, // Default 3.5-month class (105 days, DOA Crop Book p. 1)
    sourcePage: 1,
    confidence: "approximate (read from icon positions)",
  },
  {
    cropId: "rice",
    seasonId: "yala",
    operation: "assumed seasonal start (no timing in operations_timeline.csv)",
    approxTiming: "Apr wk1 (assumed)",
    startMonth: 4,
    startDay: 1, // Standard Yala season start
    durationDays: 105,
    sourcePage: 1,
    confidence: "assumed fallback - no timing in source",
  },
  {
    cropId: "maize",
    seasonId: "maha",
    operation: "sowing",
    approxTiming: "late Sep-Oct wk1",
    startMonth: 10,
    startDay: 1,
    sourcePage: 5,
    confidence: "approximate (read from icon positions)",
  },
  {
    cropId: "maize",
    seasonId: "yala",
    operation: "sowing",
    approxTiming: "Apr wk1-2",
    startMonth: 4,
    startDay: 7,
    sourcePage: 5,
    confidence: "approximate (read from icon positions)",
  },
  {
    cropId: "green_gram",
    seasonId: "maha",
    operation: "basal fertiliser + sowing",
    approxTiming: "Nov wk1",
    startMonth: 11,
    startDay: 1,
    sourcePage: 8,
    confidence: "approximate (read from icon positions)",
  },
  {
    cropId: "green_gram",
    seasonId: "yala",
    operation: "basal fertiliser + sowing",
    approxTiming: "Apr wk1-2",
    startMonth: 4,
    startDay: 7,
    sourcePage: 8,
    confidence: "approximate (read from icon positions)",
  },
  {
    cropId: "black_gram",
    seasonId: "maha",
    operation: "basal fertiliser + sowing",
    approxTiming: "Nov wk1",
    startMonth: 11,
    startDay: 1,
    sourcePage: 19,
    confidence: "approximate (read from icon positions)",
  },
  {
    cropId: "black_gram",
    seasonId: "yala",
    operation: "basal fertiliser + sowing",
    approxTiming: "Apr wk1",
    startMonth: 4,
    startDay: 1,
    sourcePage: 19,
    confidence: "approximate (read from icon positions)",
  },
  {
    cropId: "cowpea",
    seasonId: "maha",
    operation: "basal fertiliser + sowing",
    approxTiming: "Nov wk1-2",
    startMonth: 11,
    startDay: 7,
    sourcePage: 21,
    confidence: "approximate (read from icon positions)",
  },
  {
    cropId: "cowpea",
    seasonId: "yala",
    operation: "basal fertiliser + sowing",
    approxTiming: "Apr wk1-2",
    startMonth: 4,
    startDay: 7,
    sourcePage: 21,
    confidence: "approximate (read from icon positions)",
  },
];

/**
 * Helper to get the sowing timing definition for a crop in a season.
 */
export function getCropSowingTiming(
  cropId: string,
  seasonId: "maha" | "yala"
): CropSowingTiming {
  const match = OPERATIONS_TIMELINE_SOWING.find(
    (entry) => entry.cropId === cropId && entry.seasonId === seasonId
  );
  if (match) return match;

  // Fallback to season defaults if unlisted
  return {
    cropId,
    seasonId,
    operation: "seasonal start (unlisted)",
    approxTiming: seasonId === "maha" ? "Oct (assumed)" : "Apr (assumed)",
    startMonth: seasonId === "maha" ? 10 : 4,
    startDay: 1,
    sourcePage: 1,
    confidence: "assumed fallback - no timing in source",
  };
}

/**
 * 2. CLIMATE HAZARD ADVICE (from climate_hazard_advice.csv)
 * Preserves exact book wording and source pages.
 * No chemical dosage information included.
 */
export const CLIMATE_HAZARD_ADVICE: ClimateHazardAdvice[] = [
  // Rice (source: crop book, pp. 1-3)
  {
    cropId: "rice",
    hazard: "drought",
    label: "If it is dry",
    advice: "Use varieties tolerant to low water; use short-duration varieties.",
    sourcePage: 1,
  },
  {
    cropId: "rice",
    hazard: "excess_rain",
    label: "If it is very wet",
    advice: "Submergence-tolerant varieties; improve drainage; split fertiliser applications.",
    sourcePage: 1,
  },
  // Maize (source: crop book, pp. 5-6)
  {
    cropId: "maize",
    hazard: "drought",
    label: "If it is dry",
    advice: "Irrigate from ~2 weeks before male flowering until a while after female flowering.",
    sourcePage: 5,
  },
  {
    cropId: "maize",
    hazard: "excess_rain",
    label: "If it is very wet",
    advice: "Grow on raised beds in Maha; watch rust.",
    sourcePage: 5,
  },
  // Green Gram (source: crop book, pp. 8-9)
  {
    cropId: "green_gram",
    hazard: "drought",
    label: "If it is dry",
    advice: "Use mulch; use drought-tolerant varieties; sow in small plots/beds then transplant.",
    sourcePage: 8,
  },
  {
    cropId: "green_gram",
    hazard: "excess_rain",
    label: "If it is very wet",
    advice: "Improve drainage; transplant seedlings to well-drained spots; top-dress per plant need.",
    sourcePage: 8,
  },
  // Black Gram (source: crop book, p. 19)
  {
    cropId: "black_gram",
    hazard: "drought",
    label: "If it is dry",
    advice: "Use mulch; use drought-tolerant varieties.",
    sourcePage: 19,
  },
  {
    cropId: "black_gram",
    hazard: "excess_rain",
    label: "If it is very wet",
    advice: "Improve drainage; apply urea after rain stops; watch for long-term disease.",
    sourcePage: 19,
  },
  // Cowpea (source: crop book, p. 21)
  {
    cropId: "cowpea",
    hazard: "drought",
    label: "If it is dry",
    advice: "Drought-tolerant and short-duration varieties; timely planting; mulch.",
    sourcePage: 21,
  },
  {
    cropId: "cowpea",
    hazard: "excess_rain",
    label: "If it is very wet",
    advice: "Improve drainage; raised-bed planting; longer-duration varieties for Maha (Oct), short-duration after Maha rains end (Nov).",
    sourcePage: 21,
  },
];

/**
 * 3. HISTORIC REFERENCE BUDGETS (from economics_per_acre.csv)
 * Clearly labeled with price year (2013 / 2015).
 * Explicitly NOT current prices and NOT comparable across crops.
 * Not used in algorithmic scoring or sliders.
 */
export const HISTORIC_REFERENCE_BUDGETS: HistoricCropBudget[] = [
  {
    cropId: "rice",
    sourcePage: 2,
    scenario: "Rainfed Dry/Intermediate Zone",
    priceYear: 2015,
    totalCostRsPerAcre: 40700,
    yieldPerAcre: "1,376 kg",
    priceRsPerUnit: 38,
    grossIncomeRsPerAcre: 52288,
    netProfitRsPerAcre: 11588,
    notes: "Historic reference only (2015 price year: Rs 38/kg). Not current prices.",
  },
  {
    cropId: "rice",
    sourcePage: 1,
    scenario: "Irrigated Dry/Intermediate Zone",
    priceYear: 2015,
    totalCostRsPerAcre: 43430,
    yieldPerAcre: "2,152 kg",
    priceRsPerUnit: 38,
    grossIncomeRsPerAcre: 81776,
    netProfitRsPerAcre: 38346,
    notes: "Historic reference only (2015 price year: Rs 38/kg). Not current prices.",
  },
  {
    cropId: "maize",
    sourcePage: 5,
    scenario: "Rainfed Grain",
    priceYear: 2013,
    totalCostRsPerAcre: 41000,
    yieldPerAcre: "2,000 kg",
    priceRsPerUnit: 30,
    grossIncomeRsPerAcre: 60000,
    netProfitRsPerAcre: 19000,
    notes: "Historic reference only (2013 price year: Rs 30/kg grain). Not current prices.",
  },
  {
    cropId: "green_gram",
    sourcePage: 8,
    scenario: "With Family Labour",
    priceYear: 2013,
    totalCostRsPerAcre: 16480,
    yieldPerAcre: "400 kg",
    priceRsPerUnit: 170,
    grossIncomeRsPerAcre: 68000,
    netProfitRsPerAcre: 51520,
    notes: "Historic reference only (2013 price year: Rs 170/kg). Cost without family labour: Rs 31,680/ac.",
  },
  {
    cropId: "black_gram",
    sourcePage: 19,
    scenario: "With Family Labour",
    priceYear: 2013,
    totalCostRsPerAcre: 17020,
    yieldPerAcre: "465 kg",
    priceRsPerUnit: 150,
    grossIncomeRsPerAcre: 67500,
    netProfitRsPerAcre: 50480,
    notes: "Historic reference only (2013 price year: Rs 150/kg). Cost without family labour: Rs 29,820/ac.",
  },
  {
    cropId: "cowpea",
    sourcePage: 21,
    scenario: "With Family Labour",
    priceYear: 2013,
    totalCostRsPerAcre: 19340,
    yieldPerAcre: "380–400 kg",
    priceRsPerUnit: 135,
    grossIncomeRsPerAcre: 54000,
    netProfitRsPerAcre: 34660,
    notes: "Historic reference only (2013 price year: Rs 135/kg). Cost without family labour: Rs 35,340/ac.",
  },
];

/**
 * 4. ANURADHAPURA DISTRICT RECOMMENDATIONS (from districts_zones.csv)
 * The four non-rice field crops explicitly listed as recommended across all zones in Anuradhapura.
 */
export const ANURADHAPURA_RECOMMENDED_CROPS: Record<string, { recommended: boolean; sourcePage: number }> = {
  maize: { recommended: true, sourcePage: 5 },
  green_gram: { recommended: true, sourcePage: 8 },
  black_gram: { recommended: true, sourcePage: 19 },
  cowpea: { recommended: true, sourcePage: 21 },
};
