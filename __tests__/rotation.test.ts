import { describe, it, expect } from "vitest";
import {
  evaluateScenario,
  evaluateAllScenarios,
  getDefaultScenarios,
  normalizeWeights,
} from "../lib/engine/rotation";
import { SoilFormState, PriorityWeights, RotationScenarioInput } from "../lib/types/engine";
import { ProcessedClimateData } from "../lib/types/nasa";
import { CROPS } from "../data/crops";

// Mock NASA climate data based on Padaviya Dry Zone observations
const mockPadaviyaClimate: ProcessedClimateData = {
  coordinates: { latitude: 8.48, longitude: 80.72 },
  dateRange: { startDate: "20150101", endDate: "20251231", yearsAnalyzed: 11 },
  totalDailyRecords: 4018,
  missingRecordsCount: 0,
  climatology: [],
  seasonalSummary: {
    mahaRainfallMm: 1012.9,
    mahaAvgTempC: 25.4,
    mahaAvgSoilWetness: 0.754,
    yalaRainfallMm: 403.7,
    yalaAvgTempC: 28.2,
    yalaAvgSoilWetness: 0.558,
    annualRainfallMm: 1554.8,
    annualAvgTempC: 26.9,
    annualAvgSoilWetness: 0.656,
  },
  rawSample: [],
  fetchedAt: new Date().toISOString(),
};

const defaultSoil: SoilFormState = {
  ph: 6.5,
  phConfidence: "measured",
  texture: "loam",
  textureConfidence: "measured",
  organicCarbon: "medium",
  organicCarbonConfidence: "measured",
  drainage: "well_drained",
  drainageConfidence: "measured",
};

const defaultWeights: PriorityWeights = {
  waterSuitability: 40,
  soilHealth: 35,
  economicPotential: 25,
};

describe("Rotation Engine — Priority Weights Normalization", () => {
  it("normalizes slider weights so their sum equals exactly 1.0", () => {
    const { wWater, wSoil, wEcon } = normalizeWeights({
      waterSuitability: 50,
      soilHealth: 30,
      economicPotential: 20,
    });
    expect(wWater + wSoil + wEcon).toBeCloseTo(1.0);
    expect(wWater).toBe(0.5);
    expect(wSoil).toBe(0.3);
    expect(wEcon).toBe(0.2);
  });

  it("safely falls back to equal thirds if all weights are zero", () => {
    const { wWater, wSoil, wEcon } = normalizeWeights({
      waterSuitability: 0,
      soilHealth: 0,
      economicPotential: 0,
    });
    expect(wWater + wSoil + wEcon).toBeCloseTo(1.0);
  });
});

describe("Rotation Engine — Pure Function Determinism & Score Bounds", () => {
  it("returns strictly identical outputs for identical inputs (pure function)", () => {
    const scenario: RotationScenarioInput = {
      id: "B",
      title: "Legume Rotation",
      tagline: "Test",
      steps: [
        { seasonId: "maha", seasonName: "Maha", cropId: "rice" },
        { seasonId: "yala", seasonName: "Yala", cropId: "green_gram" },
        { seasonId: "maha", seasonName: "Maha", cropId: "rice" },
      ],
    };

    const run1 = evaluateScenario(scenario, mockPadaviyaClimate, defaultSoil, defaultWeights);
    const run2 = evaluateScenario(scenario, mockPadaviyaClimate, defaultSoil, defaultWeights);

    expect(run1).toEqual(run2);
  });

  it("guarantees all scores remain strictly within the 0.0 to 1.0 bounds", () => {
    const scenarios = getDefaultScenarios(["rice", "rice", "rice"]);
    scenarios.forEach((scen) => {
      const result = evaluateScenario(scen, mockPadaviyaClimate, defaultSoil, defaultWeights);
      expect(result.scores.waterSuitability).toBeGreaterThanOrEqual(0.0);
      expect(result.scores.waterSuitability).toBeLessThanOrEqual(1.0);
      expect(result.scores.soilHealth).toBeGreaterThanOrEqual(0.0);
      expect(result.scores.soilHealth).toBeLessThanOrEqual(1.0);
      expect(result.scores.economicPotential).toBeGreaterThanOrEqual(0.0);
      expect(result.scores.economicPotential).toBeLessThanOrEqual(1.0);
      expect(result.scores.compositeScore).toBeGreaterThanOrEqual(0.0);
      expect(result.scores.compositeScore).toBeLessThanOrEqual(1.0);
    });
  });
});

describe("Rotation Engine — Null Crop Values & Confidence Degradation", () => {
  it("does not crash and does not invent fake numbers when crop water requirement is null", () => {
    expect(CROPS.maize.waterNeed.value).toBeNull();
    expect(CROPS.black_gram.waterNeed.value).toBeNull();

    const maizeScenario: RotationScenarioInput = {
      id: "C",
      title: "Maize Scenario",
      tagline: "Maize test",
      steps: [
        { seasonId: "maha", seasonName: "Maha", cropId: "rice" },
        { seasonId: "yala", seasonName: "Yala", cropId: "cowpea" },
        { seasonId: "maha", seasonName: "Maha", cropId: "maize" },
      ],
    };

    const result = evaluateScenario(maizeScenario, mockPadaviyaClimate, defaultSoil, defaultWeights);

    // Score is computed without throwing
    expect(result.scores.compositeScore).toBeGreaterThan(0);

    // Explicit data gap recorded
    const maizeGap = result.dataGaps.find((g) => g.includes("Maize"));
    expect(maizeGap).toBeDefined();

    // Confidence rating is penalized for null parameter
    expect(result.confidence.scorePercent).toBeLessThan(100);
  });

  it("degrades confidence when soil inputs are unknown", () => {
    const unknownSoil: SoilFormState = {
      ph: null,
      phConfidence: "unknown",
      texture: "unknown",
      textureConfidence: "unknown",
      organicCarbon: "unknown",
      organicCarbonConfidence: "unknown",
      drainage: "unknown",
      drainageConfidence: "unknown",
    };

    const scenario = getDefaultScenarios(["rice", "rice", "rice"])[0];
    const evaluated = evaluateScenario(scenario, mockPadaviyaClimate, unknownSoil, defaultWeights);

    expect(evaluated.confidence.level).toBe("moderate");
    expect(evaluated.confidence.missingCount).toBeGreaterThanOrEqual(4);
    expect(evaluated.dataGaps).toContain("Soil pH is unknown (not measured or estimated).");
  });
});

describe("Rotation Engine — Department of Agriculture (DOA) Rules", () => {
  it("triggers severe soil health penalty and critical risk for continuous cowpea", () => {
    const consecutiveCowpeaScenario: RotationScenarioInput = {
      id: "A",
      title: "Continuous Cowpea",
      tagline: "Test",
      steps: [
        { seasonId: "maha", seasonName: "Maha", cropId: "cowpea" },
        { seasonId: "yala", seasonName: "Yala", cropId: "cowpea" },
        { seasonId: "maha", seasonName: "Maha", cropId: "rice" },
      ],
    };

    const result = evaluateScenario(
      consecutiveCowpeaScenario,
      mockPadaviyaClimate,
      defaultSoil,
      defaultWeights
    );

    const doaWarning = result.risks.find((r) => r.includes("CRITICAL DOA WARNING"));
    expect(doaWarning).toBeDefined();
    expect(doaWarning).toContain("Cowpea should NOT be grown continuously");
  });

  it("penalizes waterlogging-sensitive crops on poorly drained soils", () => {
    const waterloggedSoil: SoilFormState = {
      ...defaultSoil,
      drainage: "poor_waterlogged",
      drainageConfidence: "measured",
    };

    const legumeScenario = getDefaultScenarios(["rice", "rice", "rice"])[1]; // Rice -> Green Gram -> Rice
    const result = evaluateScenario(legumeScenario, mockPadaviyaClimate, waterloggedSoil, defaultWeights);

    const waterlogRisk = result.risks.find((r) => r.includes("waterlogged"));
    expect(waterlogRisk).toBeDefined();
  });
});

describe("Rotation Engine — Comparative Trade-offs", () => {
  it("rates legume rotation higher on soil health than continuous 3-season rice monoculture", () => {
    const [monoculture, legume] = evaluateAllScenarios(
      getDefaultScenarios(["rice", "rice", "rice"]),
      mockPadaviyaClimate,
      defaultSoil,
      defaultWeights
    );

    expect(legume.scores.soilHealth).toBeGreaterThan(monoculture.scores.soilHealth);
    expect(monoculture.risks.some((r) => r.includes("monoculture"))).toBe(true);
  });

  it("cites actual NASA rainfall figures in the output reasons", () => {
    const scenario = getDefaultScenarios(["rice", "rice", "rice"])[0];
    const result = evaluateScenario(scenario, mockPadaviyaClimate, defaultSoil, defaultWeights);

    const citations = result.reasons.join(" ");
    expect(citations).toContain("1012.9 mm"); // Maha rainfall
    expect(citations).toContain("403.7 mm"); // Yala rainfall
  });
});
