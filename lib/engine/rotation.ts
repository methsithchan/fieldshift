import {
  RotationScenarioInput,
  ScenarioEvaluation,
  SoilFormState,
  PriorityWeights,
  EvaluatedStep,
} from "@/lib/types/engine";
import { ProcessedClimateData } from "@/lib/types/nasa";
import { CropDefinition } from "@/lib/types/crops";
import { CROPS } from "@/data/crops";
import { CULTIVATION_SEASONS } from "@/data/seasons";
import { MODEL_ASSUMPTIONS } from "./assumptions";

/**
 * Normalizes priority slider weights across active (assessed) components.
 * Note: Economic potential is currently unverified (no verified price/cost data)
 * and is excluded from the composite score.
 */
export function normalizeActiveWeights(
  weights: PriorityWeights,
  hasRainfallScore: boolean
): { wRainfall: number; wSoil: number } {
  if (!hasRainfallScore) {
    return { wRainfall: 0, wSoil: 1.0 };
  }
  const sum = weights.rainfallCoverage + weights.soilHealth;
  if (sum <= 0) {
    return { wRainfall: 0.5, wSoil: 0.5 };
  }
  return {
    wRainfall: weights.rainfallCoverage / sum,
    wSoil: weights.soilHealth / sum,
  };
}

/**
 * Resolves the numeric water requirement midpoint for a crop in a given season.
 * Handles single values, ranges, and season-specific definitions (e.g. green gram 228 Maha / 270 Yala).
 */
export function getCropWaterNeedForSeason(
  crop: CropDefinition,
  seasonId: "maha" | "yala"
): number | null {
  const spec = crop.waterNeed.value;
  if (spec === null) return null;
  if (typeof spec === "number") return spec;
  if (Array.isArray(spec)) return (spec[0] + spec[1]) / 2;
  if (typeof spec === "object") {
    const seasonVal = spec[seasonId];
    if (seasonVal === undefined || seasonVal === null) return null;
    if (typeof seasonVal === "number") return seasonVal;
    if (Array.isArray(seasonVal)) return (seasonVal[0] + seasonVal[1]) / 2;
  }
  return null;
}

/**
 * Pure evaluation function for a single 3-season crop rotation scenario.
 * Strictly rule-based, deterministic, and null-aware.
 */
export function evaluateScenario(
  input: RotationScenarioInput,
  climate: ProcessedClimateData | null,
  soil: SoilFormState,
  weights: PriorityWeights
): ScenarioEvaluation {
  // Validate and resolve each step crop. THROWS on unknown crop ID (never silent fallback).
  const evaluatedSteps: [EvaluatedStep, EvaluatedStep, EvaluatedStep] = [
    resolveStep(input.steps[0]),
    resolveStep(input.steps[1]),
    resolveStep(input.steps[2]),
  ];

  const reasons: string[] = [];
  const risks: string[] = [];
  const dataGaps: string[] = [];
  let confidenceDeductions = 0;

  // Add the explicit rainfall coverage rule note required by specifications
  reasons.push(
    "Rainfall coverage ignores tank/canal irrigation; 1.0 means rainfall alone meets the crop requirement over the growth window."
  );

  // Seasons config lookup
  const mahaConfig = CULTIVATION_SEASONS.find((s) => s.id === "maha");
  const yalaConfig = CULTIVATION_SEASONS.find((s) => s.id === "yala");

  // First month index (0-11) of each season:
  // Maha starts October (month 10 -> index 9); Yala starts April (month 4 -> index 3)
  const mahaStartMonthIndex = (mahaConfig?.months[0] ?? 10) - 1;
  const yalaStartMonthIndex = (yalaConfig?.months[0] ?? 4) - 1;

  // Climate status check
  if (!climate) {
    confidenceDeductions += MODEL_ASSUMPTIONS.CONFIDENCE_DEDUCTION_NULL_CLIMATE.value;
    dataGaps.push("NASA POWER climate data has not loaded. Rainfall coverage cannot be assessed without climate observations.");
  } else {
    const mRain = climate.seasonalSummary.mahaRainfallMm;
    const yRain = climate.seasonalSummary.yalaRainfallMm;
    const mRainStr = mRain !== null ? `${mRain.toFixed(1)} mm` : "unavailable";
    const yRainStr = yRain !== null ? `${yRain.toFixed(1)} mm` : "unavailable";
    reasons.push(
      `NASA 11-year observations at selected coordinates show seasonal rainfall: Maha total = ${mRainStr}; Yala total = ${yRainStr}.`
    );
  }

  // =========================================================================
  // 1. RAINFALL COVERAGE SCORING (Strictly per-crop, never across bases)
  // Formula: water coverage = min(1, rainfall over window / midpoint of requirement)
  // Window = ceil(daysToMaturity / 30) consecutive months from season's first month
  // Handles season-specific values (e.g. green gram: 228 mm Maha, 270 mm Yala)
  // =========================================================================
  const assessedCoverageValues: number[] = [];

  evaluatedSteps.forEach((step, idx) => {
    const crop = step.crop;
    const isMaha = step.seasonId === "maha";
    const startMonthIdx = isMaha ? mahaStartMonthIndex : yalaStartMonthIndex;

    // Determine maturity days
    const maturityDays = crop.maturity.daysRange
      ? (crop.maturity.daysRange[0] + crop.maturity.daysRange[1]) / 2
      : 90;

    const totalDurationMonths =
      maturityDays / MODEL_ASSUMPTIONS.RAINFALL_WINDOW_DAYS_PER_MONTH.value;
    const fullMonths = Math.floor(totalDurationMonths);
    const lastMonthFraction = totalDurationMonths - fullMonths;
    step.windowMonthsCount = Number(totalDurationMonths.toFixed(2));

    // Resolve season-specific requirement midpoint
    const needMidpoint = getCropWaterNeedForSeason(crop, step.seasonId);
    step.cropWaterNeedMidpointMm = needMidpoint;

    // If unverified/null in reviewed literature
    if (needMidpoint === null) {
      confidenceDeductions += MODEL_ASSUMPTIONS.CONFIDENCE_DEDUCTION_NULL_WATER_NEED.value;
      dataGaps.push(
        `Season ${idx + 1} (${step.seasonName} ${crop.name}): Water requirement in mm is unverified in reviewed research (null in data/crops.ts); rainfall coverage not assessed.`
      );
      step.waterCoverageRatio = null;
      step.windowRainfallMm = null;
      return;
    }

    // If climate is null, we cannot calculate rainfall over the window
    if (!climate || !climate.climatology || climate.climatology.length < 12) {
      step.waterCoverageRatio = null;
      step.windowRainfallMm = null;
      return;
    }

    // Sum monthly rainfall over the consecutive window months:
    // full months + proportional share of the last month
    let windowRainfallSum = 0;
    let windowHasNull = false;
    const monthNamesIncluded: string[] = [];

    // Full months
    for (let m = 0; m < fullMonths; m++) {
      const targetMonthIdx = (startMonthIdx + m) % 12;
      const mData = climate.climatology[targetMonthIdx];
      monthNamesIncluded.push(mData.monthName);
      if (mData.avgMonthlyRainfallMm === null) {
        windowHasNull = true;
      } else {
        windowRainfallSum += mData.avgMonthlyRainfallMm;
      }
    }

    // Proportional share of the last month (if fractional)
    if (lastMonthFraction > 0.001) {
      const lastMonthIdx = (startMonthIdx + fullMonths) % 12;
      const lastMData = climate.climatology[lastMonthIdx];
      const fracPct = (lastMonthFraction * 100).toFixed(0);
      monthNamesIncluded.push(`${lastMData.monthName} (${fracPct}%)`);
      if (lastMData.avgMonthlyRainfallMm === null) {
        windowHasNull = true;
      } else {
        windowRainfallSum += lastMonthFraction * lastMData.avgMonthlyRainfallMm;
      }
    }

    if (windowHasNull) {
      step.waterCoverageRatio = null;
      step.windowRainfallMm = null;
      dataGaps.push(
        `Season ${idx + 1} (${step.seasonName} ${crop.name}): One or more months in growth window lack valid rainfall observations.`
      );
      return;
    }

    const roundedWindowRainfall = Number(windowRainfallSum.toFixed(1));
    step.windowRainfallMm = roundedWindowRainfall;

    // Coverage ratio: min(1.0, windowRainfall / needMidpoint)
    const coverage = Math.min(
      MODEL_ASSUMPTIONS.RAINFALL_COVERAGE_CAP.value,
      roundedWindowRainfall / needMidpoint
    );
    const roundedCoverage = Number(coverage.toFixed(2));
    step.waterCoverageRatio = roundedCoverage;
    assessedCoverageValues.push(roundedCoverage);

    const basisLabel =
      crop.waterNeed.basis === "total requirement"
        ? "total requirement (including puddling/seepage)"
        : "crop water use (ET)";

    reasons.push(
      `Season ${idx + 1} (${step.seasonName} ${crop.name}): ${roundedWindowRainfall} mm rain across ${step.windowMonthsCount}-month window (${monthNamesIncluded.join(
        "-"
      )}) covers ${(roundedCoverage * 100).toFixed(0)}% of its ${needMidpoint.toFixed(
        0
      )} mm ${basisLabel} (source: ${crop.waterNeed.source}).`
    );

    if (roundedCoverage < 0.6) {
      risks.push(
        `Season ${idx + 1} (${step.seasonName} ${crop.name}): Rainfall covers only ${(
          roundedCoverage * 100
        ).toFixed(0)}% of requirement; substantial supplementary irrigation or tank water allocation is necessary.`
      );
    }
  });

  const assessedCount = assessedCoverageValues.length;
  let finalRainfallCoverage: number | null = null;
  let coverageStatus: "full" | "partial" | "not_assessed" = "not_assessed";

  if (assessedCount === 3) {
    coverageStatus = "full";
    finalRainfallCoverage = Number(
      (
        assessedCoverageValues.reduce((a, b) => a + b, 0) / 3
      ).toFixed(2)
    );
  } else if (assessedCount > 0) {
    coverageStatus = "partial";
    finalRainfallCoverage = Number(
      (
        assessedCoverageValues.reduce((a, b) => a + b, 0) / assessedCount
      ).toFixed(2)
    );
    reasons.push(
      `Rainfall coverage assessed for ${assessedCount} of 3 seasons only (crops with unverified water need are omitted from average).`
    );
  } else {
    coverageStatus = "not_assessed";
    finalRainfallCoverage = null;
  }

  // =========================================================================
  // 2. SOIL HEALTH SCORING (0.0 to 1.0)
  // =========================================================================
  let soilScore = MODEL_ASSUMPTIONS.SOIL_BASELINE_SCORE.value;

  const cropIds = evaluatedSteps.map((s) => s.crop.id);
  const isMonoculture = cropIds[0] === cropIds[1] && cropIds[1] === cropIds[2];
  const legumeCount = evaluatedSteps.filter((s) => s.crop.nitrogenFixing).length;

  if (isMonoculture) {
    soilScore -= MODEL_ASSUMPTIONS.SOIL_MONOCULTURE_PENALTY.value;
    risks.push(
      `Continuous 3-season ${evaluatedSteps[0].crop.name} monoculture: may increase pest carryover and nutrient depletion.`
    );
  }

  // DOA RARDC Kilinochchi sourced rule: Cowpea must NOT be grown continuously
  // Only the existence of the warning is sourced; penalty size is heuristic.
  // Not applied if monoculture penalty is already active to avoid double penalty.
  const consecutiveCowpea =
    !isMonoculture &&
    ((cropIds[0] === "cowpea" && cropIds[1] === "cowpea") ||
      (cropIds[1] === "cowpea" && cropIds[2] === "cowpea"));
  if (consecutiveCowpea) {
    soilScore -= MODEL_ASSUMPTIONS.SOIL_CONSECUTIVE_COWPEA_PENALTY.value;
    risks.push(
      "DOA RARDC Kilinochchi warning: Cowpea should not be grown continuously on the same field (disease build-up risk)."
    );
  }

  // Legume bonus (biological nitrogen fixation, general knowledge)
  if (legumeCount > 0) {
    soilScore += legumeCount * MODEL_ASSUMPTIONS.SOIL_LEGUME_FIXATION_BONUS.value;
    reasons.push(
      `Includes ${legumeCount} legume season(s) with nitrogen-fixing capability (general knowledge - not sourced).`
    );
  }

  // Waterlogging risk: only where waterloggingSensitivity is sourced as "high" (Cowpea from DOA RARDC Kilinochchi)
  if (soil.drainage === "poor_waterlogged") {
    evaluatedSteps.forEach((s) => {
      if (s.crop.waterloggingSensitivity === "high") {
        soilScore -= MODEL_ASSUMPTIONS.SOIL_WATERLOGGING_PENALTY.value;
        risks.push(
          `Soil drainage is poor/waterlogged: ${s.crop.name} is sensitive to waterlogging (source: ${s.crop.waterloggingSource}).`
        );
      }
    });
  }

  // Soil organic carbon deduction
  if (soil.organicCarbon === "low") {
    soilScore -= MODEL_ASSUMPTIONS.SOIL_LOW_ORGANIC_CARBON_PENALTY.value;
    risks.push("Soil organic carbon is reported as low.");
  }

  // Soil pH and texture are informational only (no validated threshold table)
  reasons.push(
    `Soil pH (${soil.ph !== null ? soil.ph : "unknown"}) and texture class (${soil.texture}) are recorded for user reference and do not modify the score (pending validated Sri Lankan agronomic threshold tables).`
  );

  const finalSoilHealth = Number(Math.max(0.1, Math.min(1.0, soilScore)).toFixed(2));

  // =========================================================================
  // 3. ECONOMIC POTENTIAL: NOT ASSESSED (No verified price/cost data)
  // =========================================================================
  const finalEconomic: number | null = null;

  // =========================================================================
  // 4. COMPOSITE WEIGHTED SCORE (Re-normalized over assessed components)
  // =========================================================================
  const { wRainfall, wSoil } = normalizeActiveWeights(weights, finalRainfallCoverage !== null);
  const compositeScore =
    finalRainfallCoverage !== null
      ? Number((finalRainfallCoverage * wRainfall + finalSoilHealth * wSoil).toFixed(2))
      : finalSoilHealth; // If rainfall coverage is not assessed, score is soil health alone

  // =========================================================================
  // 5. DATA CONFIDENCE RATING
  // =========================================================================
  if (soil.phConfidence === "unknown") {
    confidenceDeductions += MODEL_ASSUMPTIONS.CONFIDENCE_DEDUCTION_UNKNOWN_PH.value;
    dataGaps.push("Soil pH is unknown.");
  }
  if (soil.textureConfidence === "unknown") {
    confidenceDeductions += MODEL_ASSUMPTIONS.CONFIDENCE_DEDUCTION_UNKNOWN_TEXTURE.value;
    dataGaps.push("Soil texture class is unknown.");
  }
  if (soil.drainageConfidence === "unknown") {
    confidenceDeductions += MODEL_ASSUMPTIONS.CONFIDENCE_DEDUCTION_UNKNOWN_DRAINAGE.value;
    dataGaps.push("Soil drainage condition is unknown.");
  }
  if (soil.organicCarbonConfidence === "unknown") {
    confidenceDeductions += MODEL_ASSUMPTIONS.CONFIDENCE_DEDUCTION_UNKNOWN_SOC.value;
    dataGaps.push("Soil organic carbon level is unknown.");
  }

  const confidenceScorePercent = Math.max(10, Math.min(100, 100 - confidenceDeductions));
  const confidenceLevel =
    confidenceScorePercent >= 75 ? "high" : confidenceScorePercent >= 50 ? "moderate" : "low";

  const confidenceExplanation =
    confidenceScorePercent >= 75
      ? "Most input parameters are documented. Scoring rules remain unvalidated heuristics."
      : confidenceScorePercent >= 50
      ? "Some parameters (e.g. crop water requirement or soil properties) are unverified. Scoring rules are unvalidated heuristics."
      : "Multiple quantitative parameters are null or unknown. Treat as a directional exploration aid. Scoring rules are unvalidated heuristics.";

  return {
    id: input.id,
    title: input.title,
    tagline: input.tagline,
    isExistingRotation: Boolean(input.isExistingRotation),
    steps: evaluatedSteps,
    scores: {
      rainfallCoverage: finalRainfallCoverage,
      rainfallCoverageAssessedCount: assessedCount,
      rainfallCoverageStatus: coverageStatus,
      soilHealth: finalSoilHealth,
      economicPotential: finalEconomic, // null: "Not assessed"
      compositeScore,
    },
    confidence: {
      level: confidenceLevel,
      scorePercent: confidenceScorePercent,
      missingCount: dataGaps.length,
      explanation: confidenceExplanation,
    },
    reasons,
    risks,
    dataGaps,
  };
}

/**
 * Resolves a rotation step into an EvaluatedStep with the validated CropDefinition.
 * THROWS on unknown crop ID to prevent silent fallback.
 */
function resolveStep(step: {
  seasonId: "maha" | "yala";
  seasonName: string;
  cropId: string;
}): EvaluatedStep {
  const crop = CROPS[step.cropId];
  if (!crop) {
    throw new Error(`Unknown crop ID: '${step.cropId}'. Expected one of: ${Object.keys(CROPS).join(", ")}`);
  }
  return {
    seasonId: step.seasonId,
    seasonName: step.seasonName,
    crop,
    waterCoverageRatio: null,
    windowMonthsCount: 3,
    windowRainfallMm: null,
    cropWaterNeedMidpointMm: null,
  };
}

/**
 * Returns the three standard scenarios required by the challenge:
 * Scenario A: Existing Farm Rotation (user-configurable, defaults to continuous Rice)
 * Scenario B: Rice + Legume Rotation (Rice -> Green Gram -> Rice)
 * Scenario C: Diversified Multi-Crop Rotation (Rice -> Cowpea -> Maize)
 */
export function getDefaultScenarios(
  existingCropIds: [string, string, string] = ["rice", "rice", "rice"]
): [RotationScenarioInput, RotationScenarioInput, RotationScenarioInput] {
  return [
    {
      id: "A",
      title: "Strategy A: Existing Farm Rotation",
      tagline: "Your current 3-season crop sequence",
      isExistingRotation: true,
      steps: [
        { seasonId: "maha", seasonName: "Maha (Year 1)", cropId: existingCropIds[0] },
        { seasonId: "yala", seasonName: "Yala (Year 1)", cropId: existingCropIds[1] },
        { seasonId: "maha", seasonName: "Maha (Year 2)", cropId: existingCropIds[2] },
      ],
    },
    {
      id: "B",
      title: "Strategy B: Legume Integration Rotation",
      tagline: "Rice in Maha rotated with short-duration Green Gram in Yala",
      isExistingRotation: false,
      steps: [
        { seasonId: "maha", seasonName: "Maha (Year 1)", cropId: "rice" },
        { seasonId: "yala", seasonName: "Yala (Year 1)", cropId: "green_gram" },
        { seasonId: "maha", seasonName: "Maha (Year 2)", cropId: "rice" },
      ],
    },
    {
      id: "C",
      title: "Strategy C: Diversified Resilient Rotation",
      tagline: "Rice in Maha, Cowpea in Yala, and rainfed Maize in Maha",
      isExistingRotation: false,
      steps: [
        { seasonId: "maha", seasonName: "Maha (Year 1)", cropId: "rice" },
        { seasonId: "yala", seasonName: "Yala (Year 1)", cropId: "cowpea" },
        { seasonId: "maha", seasonName: "Maha (Year 2)", cropId: "maize" },
      ],
    },
  ];
}

/**
 * Evaluates all three strategies in parallel.
 */
export function evaluateAllScenarios(
  scenarios: [RotationScenarioInput, RotationScenarioInput, RotationScenarioInput],
  climate: ProcessedClimateData | null,
  soil: SoilFormState,
  weights: PriorityWeights
): [ScenarioEvaluation, ScenarioEvaluation, ScenarioEvaluation] {
  return [
    evaluateScenario(scenarios[0], climate, soil, weights),
    evaluateScenario(scenarios[1], climate, soil, weights),
    evaluateScenario(scenarios[2], climate, soil, weights),
  ];
}
