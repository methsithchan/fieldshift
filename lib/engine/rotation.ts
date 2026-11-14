import {
  RotationScenarioInput,
  ScenarioEvaluation,
  SoilFormState,
  PriorityWeights,
  EvaluatedStep,
} from "@/lib/types/engine";
import { ProcessedClimateData } from "@/lib/types/nasa";
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
  hasWaterScore: boolean
): { wWater: number; wSoil: number } {
  if (!hasWaterScore) {
    return { wWater: 0, wSoil: 1.0 };
  }
  const sum = weights.waterSuitability + weights.soilHealth;
  if (sum <= 0) {
    return { wWater: 0.5, wSoil: 0.5 };
  }
  return {
    wWater: weights.waterSuitability / sum,
    wSoil: weights.soilHealth / sum,
  };
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
  // Validate and resolve each step crop. THROW on unknown crop ID (never silent fallback).
  const evaluatedSteps: [EvaluatedStep, EvaluatedStep, EvaluatedStep] = [
    resolveStep(input.steps[0]),
    resolveStep(input.steps[1]),
    resolveStep(input.steps[2]),
  ];

  const reasons: string[] = [];
  const risks: string[] = [];
  const dataGaps: string[] = [];
  let confidenceDeductions = 0;

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
    dataGaps.push("NASA POWER climate data has not loaded. Water coverage cannot be assessed without climate observations.");
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
  // 1. WATER SUITABILITY SCORING (Strictly per-crop, never across bases)
  // Formula: water coverage = min(1, rainfall over window / midpoint of requirement)
  // Window = ceil(daysToMaturity / 30) consecutive months from season's first month
  // =========================================================================
  const assessedCoverageValues: number[] = [];

  evaluatedSteps.forEach((step, idx) => {
    const crop = step.crop;
    const isMaha = step.seasonId === "maha";
    const startMonthIdx = isMaha ? mahaStartMonthIndex : yalaStartMonthIndex;

    // Determine maturity days (use midpoint or default window)
    const maturityDays = crop.maturity.daysRange
      ? (crop.maturity.daysRange[0] + crop.maturity.daysRange[1]) / 2
      : 90;

    const windowMonthsCount = Math.ceil(
      maturityDays / MODEL_ASSUMPTIONS.WATER_WINDOW_DAYS_PER_MONTH.value
    );
    step.windowMonthsCount = windowMonthsCount;

    // Check if crop has a verified water requirement in mm
    if (crop.waterNeed.value === null) {
      confidenceDeductions += MODEL_ASSUMPTIONS.CONFIDENCE_DEDUCTION_NULL_WATER_NEED.value;
      dataGaps.push(
        `Season ${idx + 1} (${step.seasonName} ${crop.name}): Water requirement in mm is unverified in reviewed research (null in data/crops.ts); water coverage not assessed.`
      );
      step.waterCoverageRatio = null;
      step.windowRainfallMm = null;
      step.cropWaterNeedMidpointMm = null;
      return;
    }

    // Midpoint of this crop's own requirement
    const needMidpoint = Array.isArray(crop.waterNeed.value)
      ? (crop.waterNeed.value[0] + crop.waterNeed.value[1]) / 2
      : crop.waterNeed.value;
    step.cropWaterNeedMidpointMm = needMidpoint;

    // If climate is null, we cannot calculate rainfall over the window
    if (!climate || !climate.climatology || climate.climatology.length < 12) {
      step.waterCoverageRatio = null;
      step.windowRainfallMm = null;
      return;
    }

    // Sum monthly rainfall over the consecutive window months
    let windowRainfallSum = 0;
    let windowHasNull = false;
    const monthNamesIncluded: string[] = [];

    for (let m = 0; m < windowMonthsCount; m++) {
      const targetMonthIdx = (startMonthIdx + m) % 12;
      const mData = climate.climatology[targetMonthIdx];
      monthNamesIncluded.push(mData.monthName);
      if (mData.avgMonthlyRainfallMm === null) {
        windowHasNull = true;
      } else {
        windowRainfallSum += mData.avgMonthlyRainfallMm;
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
      MODEL_ASSUMPTIONS.WATER_COVERAGE_CAP.value,
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
      `Season ${idx + 1} (${step.seasonName} ${crop.name}): ${roundedWindowRainfall} mm rain across ${windowMonthsCount}-month window (${monthNamesIncluded.join(
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

  const finalWaterSuitability =
    assessedCoverageValues.length > 0
      ? Number(
          (
            assessedCoverageValues.reduce((a, b) => a + b, 0) / assessedCoverageValues.length
          ).toFixed(2)
        )
      : null;

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
      `Continuous 3-season ${evaluatedSteps[0].crop.name} monoculture: Increases pest carryover and uniform nutrient depletion.`
    );
  }

  // DOA RARDC Kilinochchi sourced rule: Cowpea must NOT be grown continuously
  const consecutiveCowpea =
    (cropIds[0] === "cowpea" && cropIds[1] === "cowpea") ||
    (cropIds[1] === "cowpea" && cropIds[2] === "cowpea");
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
    risks.push("Soil organic carbon is reported as low (<1.0%).");
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
  const { wWater, wSoil } = normalizeActiveWeights(weights, finalWaterSuitability !== null);
  const compositeScore =
    finalWaterSuitability !== null
      ? Number((finalWaterSuitability * wWater + finalSoilHealth * wSoil).toFixed(2))
      : finalSoilHealth; // If water is not assessed, score is soil health only

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
    confidenceLevel === "high"
      ? "High confidence: Key agronomic parameters and local soil conditions are documented."
      : confidenceLevel === "moderate"
      ? "Moderate confidence: Some parameters (e.g. crop water requirement or soil properties) are unverified."
      : "Low confidence: Multiple quantitative parameters are null or unknown. Treat as a directional exploration aid.";

  return {
    id: input.id,
    title: input.title,
    tagline: input.tagline,
    isExistingRotation: Boolean(input.isExistingRotation),
    steps: evaluatedSteps,
    scores: {
      waterSuitability: finalWaterSuitability,
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
