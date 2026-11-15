/**
 * Model Assumptions (Not Validated by an Agronomist)
 *
 * All scoring weights, penalties, bonuses, and window calculations are centralized
 * here for full transparency. None of these parameters represent yield predictions.
 */

export interface ModelAssumption {
  id: string;
  name: string;
  category: "rainfall" | "soil" | "input_completeness" | "economic";
  value: number;
  unit: string;
  description: string;
  validationStatus: "unvalidated - heuristic rule";
}

export const MODEL_ASSUMPTIONS: Record<string, ModelAssumption> = {
  RAINFALL_WINDOW_DAYS_PER_MONTH: {
    id: "RAINFALL_WINDOW_DAYS_PER_MONTH",
    name: "Crop Rainfall Window Divisor",
    category: "rainfall",
    value: 30,
    unit: "days/month",
    description:
      "Calculates daily rainfall rate per month (monthly rainfall / days in month) and integrates over the crop's exact duration days starting from the specific sowing day offset in operations_timeline.csv.",
    validationStatus: "unvalidated - heuristic rule",
  },
  RICE_MAHA_SOWING_AND_DURATION_ASSUMPTION: {
    id: "RICE_MAHA_SOWING_AND_DURATION_ASSUMPTION",
    name: "Rice Maha 3.5-Month Class & Sowing Offset",
    category: "rainfall",
    value: 105,
    unit: "days (starts 22 Oct)",
    description:
      "Rice Maha default uses the 3.5-month class (105 days duration), with nursery/sowing starting ~22 Oct (Oct wk3-4, the crop recommendations book, p. 1). Note: 2.5-month and 3-month classes are sown in November per the operations timeline.",
    validationStatus: "unvalidated - heuristic rule",
  },
  RICE_YALA_SOWING_WINDOW_ASSUMPTION: {
    id: "RICE_YALA_SOWING_WINDOW_ASSUMPTION",
    name: "Rice Yala Sowing Window Fallback",
    category: "rainfall",
    value: 4,
    unit: "start month (April)",
    description:
      "Because operations_timeline.csv omits Yala sowing timing for Rice, the model assumes April 1 (start of standard Yala season) as the default sowing window start day.",
    validationStatus: "unvalidated - heuristic rule",
  },
  RAINFALL_COVERAGE_CAP: {
    id: "RAINFALL_COVERAGE_CAP",
    name: "Maximum Rainfall Coverage Cap",
    category: "rainfall",
    value: 1.0,
    unit: "ratio",
    description:
      "Rainfall coverage is capped at min(1.0, rainfall / requirement midpoint). Rainfall coverage ignores tank/canal irrigation; 1.0 means rainfall alone meets the crop requirement over the growth window.",
    validationStatus: "unvalidated - heuristic rule",
  },
  SOIL_BASELINE_SCORE: {
    id: "SOIL_BASELINE_SCORE",
    name: "Soil Health Baseline",
    category: "soil",
    value: 0.6,
    unit: "index (0-1)",
    description: "Neutral starting point for a standard 3-season crop sequence before adjustments.",
    validationStatus: "unvalidated - heuristic rule",
  },
  SOIL_MONOCULTURE_PENALTY: {
    id: "SOIL_MONOCULTURE_PENALTY",
    name: "Continuous Monoculture Penalty",
    category: "soil",
    value: 0.25,
    unit: "deduction",
    description: "Deduction if all 3 seasons cultivate the identical crop (pest carryover and soil structure fatigue).",
    validationStatus: "unvalidated - heuristic rule",
  },
  SOIL_CONSECUTIVE_COWPEA_PENALTY: {
    id: "SOIL_CONSECUTIVE_COWPEA_PENALTY",
    name: "Consecutive Cowpea Prohibition Penalty",
    category: "soil",
    value: 0.35,
    unit: "deduction",
    description:
      "Deduction when cowpea is grown consecutively in the same rotation (only the existence of the DOA RARDC Kilinochchi warning against soil disease build-up is sourced, not the deduction size; not applied if monoculture penalty is already active).",
    validationStatus: "unvalidated - heuristic rule",
  },
  SOIL_LEGUME_FIXATION_BONUS: {
    id: "SOIL_LEGUME_FIXATION_BONUS",
    name: "Legume Nitrogen Fixation Bonus",
    category: "soil",
    value: 0.12,
    unit: "bonus per season",
    description:
      "Bonus added for each legume season (green gram, cowpea, black gram) for biological nitrogen fixation.",
    validationStatus: "unvalidated - heuristic rule",
  },
  SOIL_WATERLOGGING_PENALTY: {
    id: "SOIL_WATERLOGGING_PENALTY",
    name: "Waterlogging Soil Penalty",
    category: "soil",
    value: 0.2,
    unit: "deduction",
    description:
      "Deduction per season if a crop with documented high waterlogging sensitivity (Cowpea, DOA RARDC Kilinochchi) is on poor/waterlogged soil (only the existence of the sensitivity is sourced, not the deduction size).",
    validationStatus: "unvalidated - heuristic rule",
  },
  SOIL_LOW_ORGANIC_CARBON_PENALTY: {
    id: "SOIL_LOW_ORGANIC_CARBON_PENALTY",
    name: "Low Organic Carbon Penalty",
    category: "soil",
    value: 0.08,
    unit: "deduction",
    description: "Deduction applied if soil organic carbon is reported as low.",
    validationStatus: "unvalidated - heuristic rule",
  },
  CONFIDENCE_DEDUCTION_UNKNOWN_PH: {
    id: "CONFIDENCE_DEDUCTION_UNKNOWN_PH",
    name: "Unknown pH Completeness Deduction",
    category: "input_completeness",
    value: 8,
    unit: "% deduction",
    description: "Deduction from 100% input completeness score when soil pH is unknown.",
    validationStatus: "unvalidated - heuristic rule",
  },
  CONFIDENCE_DEDUCTION_UNKNOWN_TEXTURE: {
    id: "CONFIDENCE_DEDUCTION_UNKNOWN_TEXTURE",
    name: "Unknown Texture Completeness Deduction",
    category: "input_completeness",
    value: 10,
    unit: "% deduction",
    description: "Deduction from input completeness score when soil texture is unknown.",
    validationStatus: "unvalidated - heuristic rule",
  },
  CONFIDENCE_DEDUCTION_UNKNOWN_DRAINAGE: {
    id: "CONFIDENCE_DEDUCTION_UNKNOWN_DRAINAGE",
    name: "Unknown Drainage Completeness Deduction",
    category: "input_completeness",
    value: 12,
    unit: "% deduction",
    description: "Deduction from input completeness score when soil drainage is unknown.",
    validationStatus: "unvalidated - heuristic rule",
  },
  CONFIDENCE_DEDUCTION_UNKNOWN_SOC: {
    id: "CONFIDENCE_DEDUCTION_UNKNOWN_SOC",
    name: "Unknown SOC Completeness Deduction",
    category: "input_completeness",
    value: 8,
    unit: "% deduction",
    description: "Deduction from input completeness score when organic carbon is unknown.",
    validationStatus: "unvalidated - heuristic rule",
  },
  CONFIDENCE_DEDUCTION_NULL_WATER_NEED: {
    id: "CONFIDENCE_DEDUCTION_NULL_WATER_NEED",
    name: "Unmeasured Crop Water Need Completeness Deduction",
    category: "input_completeness",
    value: 15,
    unit: "% deduction",
    description: "Deduction from input completeness score per crop whose water requirement is null/unverified (Maize, Black Gram).",
    validationStatus: "unvalidated - heuristic rule",
  },
  CONFIDENCE_DEDUCTION_NULL_CLIMATE: {
    id: "CONFIDENCE_DEDUCTION_NULL_CLIMATE",
    name: "Missing Climate Data Completeness Deduction",
    category: "input_completeness",
    value: 35,
    unit: "% deduction",
    description: "Deduction from input completeness score when NASA POWER climate data has not loaded.",
    validationStatus: "unvalidated - heuristic rule",
  },
};

export const ASSUMPTIONS_LIST: ModelAssumption[] = Object.values(MODEL_ASSUMPTIONS);
