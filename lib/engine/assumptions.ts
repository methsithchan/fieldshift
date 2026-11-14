/**
 * Model Assumptions (Not Validated by an Agronomist)
 *
 * All scoring weights, penalties, bonuses, and window calculations are centralized
 * here for full transparency. None of these parameters represent yield predictions.
 */

export interface ModelAssumption {
  id: string;
  name: string;
  category: "water" | "soil" | "confidence" | "economic";
  value: number;
  unit: string;
  description: string;
  validationStatus: "unvalidated - heuristic rule" | "agronomic convention" | "doa recommendation";
}

export const MODEL_ASSUMPTIONS: Record<string, ModelAssumption> = {
  WATER_WINDOW_DAYS_PER_MONTH: {
    id: "WATER_WINDOW_DAYS_PER_MONTH",
    name: "Crop Water Window Divisor",
    category: "water",
    value: 30,
    unit: "days/month",
    description:
      "Assumes crop water exposure window spans ceil(daysToMaturity / 30) consecutive months starting from the season's first month.",
    validationStatus: "unvalidated - heuristic rule",
  },
  WATER_COVERAGE_CAP: {
    id: "WATER_COVERAGE_CAP",
    name: "Maximum Water Coverage Cap",
    category: "water",
    value: 1.0,
    unit: "ratio",
    description: "Water coverage is capped at min(1.0, rainfall / requirement midpoint). Excess rain does not yield bonus points.",
    validationStatus: "agronomic convention",
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
      "Deduction when cowpea is grown consecutively in the same rotation (reflecting DOA RARDC Kilinochchi warning against soil disease build-up).",
    validationStatus: "doa recommendation",
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
      "Deduction per season if a crop with documented high waterlogging sensitivity (Cowpea, DOA RARDC Kilinochchi) is on poor/waterlogged soil.",
    validationStatus: "doa recommendation",
  },
  SOIL_LOW_ORGANIC_CARBON_PENALTY: {
    id: "SOIL_LOW_ORGANIC_CARBON_PENALTY",
    name: "Low Organic Carbon Penalty",
    category: "soil",
    value: 0.08,
    unit: "deduction",
    description: "Deduction applied if soil organic carbon is reported as low (<1.0%).",
    validationStatus: "unvalidated - heuristic rule",
  },
  CONFIDENCE_DEDUCTION_UNKNOWN_PH: {
    id: "CONFIDENCE_DEDUCTION_UNKNOWN_PH",
    name: "Unknown pH Confidence Deduction",
    category: "confidence",
    value: 8,
    unit: "% deduction",
    description: "Deduction from 100% confidence score when soil pH is unknown.",
    validationStatus: "unvalidated - heuristic rule",
  },
  CONFIDENCE_DEDUCTION_UNKNOWN_TEXTURE: {
    id: "CONFIDENCE_DEDUCTION_UNKNOWN_TEXTURE",
    name: "Unknown Texture Confidence Deduction",
    category: "confidence",
    value: 10,
    unit: "% deduction",
    description: "Deduction from confidence score when soil texture is unknown.",
    validationStatus: "unvalidated - heuristic rule",
  },
  CONFIDENCE_DEDUCTION_UNKNOWN_DRAINAGE: {
    id: "CONFIDENCE_DEDUCTION_UNKNOWN_DRAINAGE",
    name: "Unknown Drainage Confidence Deduction",
    category: "confidence",
    value: 12,
    unit: "% deduction",
    description: "Deduction from confidence score when soil drainage is unknown.",
    validationStatus: "unvalidated - heuristic rule",
  },
  CONFIDENCE_DEDUCTION_UNKNOWN_SOC: {
    id: "CONFIDENCE_DEDUCTION_UNKNOWN_SOC",
    name: "Unknown SOC Confidence Deduction",
    category: "confidence",
    value: 8,
    unit: "% deduction",
    description: "Deduction from confidence score when organic carbon is unknown.",
    validationStatus: "unvalidated - heuristic rule",
  },
  CONFIDENCE_DEDUCTION_NULL_WATER_NEED: {
    id: "CONFIDENCE_DEDUCTION_NULL_WATER_NEED",
    name: "Unmeasured Crop Water Need Deduction",
    category: "confidence",
    value: 15,
    unit: "% deduction",
    description: "Deduction per crop whose water requirement is null/unverified (Maize, Black Gram).",
    validationStatus: "unvalidated - heuristic rule",
  },
  CONFIDENCE_DEDUCTION_NULL_CLIMATE: {
    id: "CONFIDENCE_DEDUCTION_NULL_CLIMATE",
    name: "Missing Climate Data Deduction",
    category: "confidence",
    value: 35,
    unit: "% deduction",
    description: "Deduction when NASA POWER climate data has not loaded.",
    validationStatus: "unvalidated - heuristic rule",
  },
};

export const ASSUMPTIONS_LIST: ModelAssumption[] = Object.values(MODEL_ASSUMPTIONS);
