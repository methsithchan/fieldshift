import { CropDefinition } from "./crops";

export type DataConfidenceLabel = "measured" | "estimated" | "unknown";

export type SoilTextureType =
  | "sandy"
  | "loam"
  | "clay_loam"
  | "heavy_clay"
  | "unknown";

export type SoilDrainageType =
  | "excessive"
  | "well_drained"
  | "imperfect"
  | "poor_waterlogged"
  | "unknown";

export type SoilOrganicCarbonType =
  | "low"
  | "medium"
  | "high"
  | "unknown";

export interface SoilFormState {
  ph: number | null; // e.g. 6.5, or null if unknown
  phConfidence: DataConfidenceLabel;

  texture: SoilTextureType;
  textureConfidence: DataConfidenceLabel;

  organicCarbon: SoilOrganicCarbonType;
  organicCarbonConfidence: DataConfidenceLabel;

  drainage: SoilDrainageType;
  drainageConfidence: DataConfidenceLabel;
}

export interface PriorityWeights {
  rainfallCoverage: number; // 0 - 100
  soilHealth: number; // 0 - 100
  economicPotential: number; // 0 - 100 (disabled, shown as "Not assessed")
}

export interface RotationStep {
  seasonId: "maha" | "yala";
  seasonName: string;
  cropId: string;
}

export interface RotationScenarioInput {
  id: "A" | "B" | "C";
  title: string;
  tagline: string;
  steps: [RotationStep, RotationStep, RotationStep]; // Exactly 3 seasons
  isExistingRotation?: boolean;
}

export interface EvaluatedStep {
  seasonId: "maha" | "yala";
  seasonName: string;
  crop: CropDefinition;
  waterCoverageRatio: number | null; // null if unverified water requirement or missing climate
  windowMonthsCount: number;
  windowRainfallMm: number | null;
  cropWaterNeedMidpointMm: number | null;
  sowingTiming?: {
    approxTiming: string;
    startMonth: number;
    startDay: number;
    durationDays?: number;
    sourcePage: number;
    confidence: string;
  };
}

export interface ScenarioEvaluation {
  id: "A" | "B" | "C";
  title: string;
  tagline: string;
  isExistingRotation: boolean;
  steps: [EvaluatedStep, EvaluatedStep, EvaluatedStep];

  // Transparent Sub-Scores (each strictly bounded 0.00 to 1.00, or null if Not Assessed)
  scores: {
    rainfallCoverage: number | null; // null if climate is null or 0 of 3 seasons assessed
    rainfallCoverageAssessedCount: number; // 0, 1, 2, or 3
    rainfallCoverageStatus: "full" | "partial" | "not_assessed";
    soilHealth: number; // 0.00 to 1.00
    economicPotential: number | null; // null: "Not assessed" (no verified price/cost data)
    compositeScore: number | null; // Re-normalized over assessed components only
  };

  // Data Confidence Rating (Degrades gracefully when values are null or unknown)
  confidence: {
    level: "high" | "moderate" | "low";
    scorePercent: number; // 0 - 100%
    missingCount: number;
    explanation: string;
  };

  // Plain-Language Reasons (Must cite actual NASA observations at the selected coordinates)
  reasons: string[];

  // Actionable Agronomic Risks Needing Local Expert Review
  risks: string[];

  // Explicit Data Gaps (Never hidden or silently fabricated)
  dataGaps: string[];
}
