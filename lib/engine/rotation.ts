import {
  RotationScenarioInput,
  ScenarioEvaluation,
  SoilFormState,
  PriorityWeights,
  EvaluatedStep,
} from "@/lib/types/engine";
import { ProcessedClimateData } from "@/lib/types/nasa";
import { CROPS } from "@/data/crops";

/**
 * Normalizes priority slider weights so they sum to 1.0 (100%).
 */
export function normalizeWeights(weights: PriorityWeights): {
  wWater: number;
  wSoil: number;
  wEcon: number;
} {
  const sum = weights.waterSuitability + weights.soilHealth + weights.economicPotential;
  if (sum <= 0) {
    return { wWater: 0.34, wSoil: 0.33, wEcon: 0.33 };
  }
  return {
    wWater: weights.waterSuitability / sum,
    wSoil: weights.soilHealth / sum,
    wEcon: weights.economicPotential / sum,
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
  const evaluatedSteps: [EvaluatedStep, EvaluatedStep, EvaluatedStep] = [
    {
      seasonId: input.steps[0].seasonId,
      seasonName: input.steps[0].seasonName,
      crop: CROPS[input.steps[0].cropId] || CROPS.rice,
    },
    {
      seasonId: input.steps[1].seasonId,
      seasonName: input.steps[1].seasonName,
      crop: CROPS[input.steps[1].cropId] || CROPS.green_gram,
    },
    {
      seasonId: input.steps[2].seasonId,
      seasonName: input.steps[2].seasonName,
      crop: CROPS[input.steps[2].cropId] || CROPS.rice,
    },
  ];

  const reasons: string[] = [];
  const risks: string[] = [];
  const dataGaps: string[] = [];
  let confidenceDeductions = 0;

  // NASA Climate Metrics (if available)
  const mahaRain = climate?.seasonalSummary.mahaRainfallMm ?? 1000;
  const yalaRain = climate?.seasonalSummary.yalaRainfallMm ?? 400;
  const mahaWetness = climate?.seasonalSummary.mahaAvgSoilWetness ?? 0.75;
  const yalaWetness = climate?.seasonalSummary.yalaAvgSoilWetness ?? 0.55;

  if (!climate) {
    confidenceDeductions += 30;
    dataGaps.push("NASA POWER climate data is not yet loaded; using default regional estimates.");
  } else {
    reasons.push(
      `NASA observations at this point show an average of ${mahaRain.toFixed(1)} mm in Maha (GWETROOT: ${mahaWetness.toFixed(2)}) versus ${yalaRain.toFixed(1)} mm in Yala (GWETROOT: ${yalaWetness.toFixed(2)}).`
    );
  }

  // ==========================================
  // 1. WATER SUITABILITY SCORING (0.0 to 1.0)
  // ==========================================
  let waterScoreSum = 0;

  evaluatedSteps.forEach((step, idx) => {
    const crop = step.crop;
    const isMaha = step.seasonId === "maha";
    const seasonRain = isMaha ? mahaRain : yalaRain;
    const seasonWetness = isMaha ? mahaWetness : yalaWetness;

    if (crop.id === "rice") {
      // Rice: water basis is 'total requirement' (948–1232 mm)
      if (isMaha) {
        if (seasonRain >= 900) {
          waterScoreSum += 0.88;
          reasons.push(
            `Season ${idx + 1} (${step.seasonName} Rice): Maha rainfall (${seasonRain.toFixed(1)} mm) supplies the majority of paddy total requirement (948–1,232 mm).`
          );
        } else {
          waterScoreSum += 0.72;
          reasons.push(
            `Season ${idx + 1} (${step.seasonName} Rice): Maha rainfall (${seasonRain.toFixed(1)} mm) requires modest supplementary irrigation to meet 948–1,232 mm total demand.`
          );
        }
      } else {
        // Rice in Yala
        waterScoreSum += 0.42;
        risks.push(
          `Season ${idx + 1} (${step.seasonName} Rice): Yala rainfall (${seasonRain.toFixed(1)} mm) creates a substantial water deficit (~${(1100 - seasonRain).toFixed(0)} mm) against rice total requirement (948–1,232 mm), requiring heavy tank release.`
        );
      }
    } else if (crop.id === "green_gram") {
      // Green gram: water basis is 'crop water use' (228–270 mm)
      if (!isMaha) {
        waterScoreSum += 0.92;
        reasons.push(
          `Season ${idx + 1} (${step.seasonName} Green Gram): Yala rainfall (${seasonRain.toFixed(1)} mm) and residual moisture readily satisfy green gram crop water use (228–270 mm).`
        );
      } else {
        waterScoreSum += 0.78;
        if (seasonWetness > 0.8) {
          risks.push(
            `Season ${idx + 1} (${step.seasonName} Green Gram): High Maha soil wetness (${seasonWetness.toFixed(2)}) risks waterlogging for green gram.`
          );
        }
      }
    } else if (crop.id === "cowpea") {
      // Cowpea: water basis is 'crop water use' (175–288 mm)
      if (!isMaha) {
        waterScoreSum += 0.9;
        reasons.push(
          `Season ${idx + 1} (${step.seasonName} Cowpea): Suited to Yala conditions; consumptive water use (175–288 mm) fits well within dry season rainfall and residual moisture.`
        );
      } else {
        waterScoreSum += 0.75;
      }
    } else {
      // Maize or Black Gram: water need is null (unverified in local research trials)
      confidenceDeductions += 12;
      dataGaps.push(
        `${crop.name} water requirement in mm is unverified in reviewed Sri Lanka Dry Zone publications (marked null in crops.ts).`
      );

      // Score based on known seasonal cultivation preference rather than faking water mm
      if (crop.id === "maize" && isMaha) {
        waterScoreSum += 0.82;
        reasons.push(
          `Season ${idx + 1} (${step.seasonName} Maize): Aligned with national target preference (85% grown rainfed in Maha). Precise mm need is unverified.`
        );
      } else if (crop.id === "black_gram" && isMaha) {
        waterScoreSum += 0.84;
        reasons.push(
          `Season ${idx + 1} (${step.seasonName} Black Gram): Aligned with rainfed upland Maha pattern (80% national share).`
        );
      } else {
        waterScoreSum += 0.6;
      }
    }
  });

  const waterSuitability = Math.max(0.1, Math.min(1.0, waterScoreSum / 3));

  // ==========================================
  // 2. SOIL HEALTH SCORING (0.0 to 1.0)
  // ==========================================
  let soilScore = 0.65;

  const cropIds = evaluatedSteps.map((s) => s.crop.id);
  const isMonoculture = cropIds[0] === cropIds[1] && cropIds[1] === cropIds[2];
  const legumeCount = evaluatedSteps.filter((s) => s.crop.nitrogenFixing).length;

  if (isMonoculture) {
    soilScore -= 0.28;
    risks.push(
      `Continuous 3-season ${evaluatedSteps[0].crop.name} monoculture: Increases pest carryover, degrades soil structure, and depletes uniform nutrient pools.`
    );
  }

  // DOA Specific Rule: Cowpea must NOT be grown continuously
  const consecutiveCowpea =
    (cropIds[0] === "cowpea" && cropIds[1] === "cowpea") ||
    (cropIds[1] === "cowpea" && cropIds[2] === "cowpea");
  if (consecutiveCowpea) {
    soilScore -= 0.35;
    risks.push(
      "CRITICAL DOA WARNING: Sri Lanka Department of Agriculture guidelines explicitly advise that Cowpea should NOT be grown continuously on the same field to prevent rapid build-up of soil-borne wilt and root rot diseases."
    );
  }

  // Nitrogen Fixing Bonus
  if (legumeCount > 0) {
    soilScore += legumeCount * 0.12;
    reasons.push(
      `Includes ${legumeCount} nitrogen-fixing legume crop(s) (${evaluatedSteps
        .filter((s) => s.crop.nitrogenFixing)
        .map((s) => s.crop.name)
        .join(", ")}), providing biological nitrogen fixation and high-quality biomass return.`
    );
  }

  // Soil Drainage Interaction
  if (soil.drainage === "poor_waterlogged") {
    evaluatedSteps.forEach((s) => {
      if (s.crop.waterloggingSensitivity === "high") {
        soilScore -= 0.18;
        risks.push(
          `Soil drainage is reported as poor/waterlogged: ${s.crop.name} is highly sensitive to poor drainage and waterlogging (DOA warning: collar rot and root asphyxiation risk).`
        );
      }
    });
  } else if (soil.drainage === "well_drained") {
    soilScore += 0.05;
  }

  // Soil Organic Carbon Interaction
  if (soil.organicCarbon === "low") {
    soilScore -= 0.08;
    if (legumeCount > 0) {
      reasons.push(
        "Low soil organic carbon detected: Legume incorporation is particularly recommended to rebuild organic active matter."
      );
    }
  }

  const finalSoilHealth = Math.max(0.1, Math.min(1.0, soilScore));

  // ==========================================
  // 3. ECONOMIC POTENTIAL SCORING (0.0 to 1.0)
  // ==========================================
  // Comparative trade-off index: diversification spread vs single market volatility
  let econScore = 0.65;

  if (isMonoculture) {
    econScore -= 0.18;
    risks.push(
      "Monoculture market vulnerability: Concentrates all farm revenue in a single commodity price cycle and requires higher synthetic fertilizer expenditure."
    );
  } else if (legumeCount > 0) {
    econScore += 0.15;
    reasons.push(
      "Diversified cash crop rotation: Introduces high-value pulses (green gram/cowpea) with strong local demand while lowering synthetic nitrogen fertilizer expenses."
    );
  }

  const finalEconomic = Math.max(0.1, Math.min(1.0, econScore));

  // ==========================================
  // 4. COMPOSITE WEIGHTED SCORE
  // ==========================================
  const { wWater, wSoil, wEcon } = normalizeWeights(weights);
  const compositeScore = Number(
    (waterSuitability * wWater + finalSoilHealth * wSoil + finalEconomic * wEcon).toFixed(2)
  );

  // ==========================================
  // 5. DATA CONFIDENCE ASSESSMENT
  // ==========================================
  // Soil Form confidence deductions
  if (soil.phConfidence === "unknown") {
    confidenceDeductions += 8;
    dataGaps.push("Soil pH is unknown (not measured or estimated).");
  }
  if (soil.textureConfidence === "unknown") {
    confidenceDeductions += 10;
    dataGaps.push("Soil texture class is unknown.");
  }
  if (soil.drainageConfidence === "unknown") {
    confidenceDeductions += 12;
    dataGaps.push("Soil drainage class is unknown.");
  }
  if (soil.organicCarbonConfidence === "unknown") {
    confidenceDeductions += 8;
    dataGaps.push("Soil organic carbon content is unknown.");
  }

  const confidenceScorePercent = Math.max(20, Math.min(100, 100 - confidenceDeductions));
  const confidenceLevel =
    confidenceScorePercent >= 75 ? "high" : confidenceScorePercent >= 50 ? "moderate" : "low";

  const confidenceExplanation =
    confidenceLevel === "high"
      ? "High confidence: Crop parameters and soil characteristics are well supported by research station trials."
      : confidenceLevel === "moderate"
      ? "Moderate confidence: Some crop water values or soil parameters are unverified and require local extension officer input."
      : "Low confidence: Multiple quantitative parameters are null or unknown. Treat scores as conceptual directional guides only.";

  return {
    id: input.id,
    title: input.title,
    tagline: input.tagline,
    isExistingRotation: Boolean(input.isExistingRotation),
    steps: evaluatedSteps,
    scores: {
      waterSuitability: Number(waterSuitability.toFixed(2)),
      soilHealth: Number(finalSoilHealth.toFixed(2)),
      economicPotential: Number(finalEconomic.toFixed(2)),
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
      tagline: "Rice in Maha rotated with short-duration Green Gram in water-scarce Yala",
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
      tagline: "Rice in Maha, drought-hardy Cowpea in Yala, and commercial upland Maize in Maha",
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
