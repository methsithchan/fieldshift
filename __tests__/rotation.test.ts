import { describe, it, expect } from "vitest";
import {
  evaluateScenario,
  evaluateAllScenarios,
  getDefaultScenarios,
  normalizeActiveWeights,
} from "../lib/engine/rotation";
import { SoilFormState, PriorityWeights, RotationScenarioInput } from "../lib/types/engine";
import { ProcessedClimateData, MonthlyClimatology } from "../lib/types/nasa";
import { CROPS } from "../data/crops";

// Mock 12-month NASA climatology for Dry Zone (Padaviya)
const mock12Months: MonthlyClimatology[] = [
  { monthIndex: 0, monthNumber: 1, monthName: "Jan", avgMonthlyRainfallMm: 103.8, avgTemperatureC: 25.0, avgSoilWetness: 0.8, avgRelativeHumidity: 85, validDaysCount: 341, missingDaysCount: 0 },
  { monthIndex: 1, monthNumber: 2, monthName: "Feb", avgMonthlyRainfallMm: 73.1, avgTemperatureC: 25.8, avgSoilWetness: 0.72, avgRelativeHumidity: 80, validDaysCount: 310, missingDaysCount: 0 },
  { monthIndex: 2, monthNumber: 3, monthName: "Mar", avgMonthlyRainfallMm: 54.2, avgTemperatureC: 27.5, avgSoilWetness: 0.65, avgRelativeHumidity: 78, validDaysCount: 341, missingDaysCount: 0 },
  { monthIndex: 3, monthNumber: 4, monthName: "Apr", avgMonthlyRainfallMm: 140.5, avgTemperatureC: 29.0, avgSoilWetness: 0.68, avgRelativeHumidity: 79, validDaysCount: 330, missingDaysCount: 0 },
  { monthIndex: 4, monthNumber: 5, monthName: "May", avgMonthlyRainfallMm: 68.2, avgTemperatureC: 29.5, avgSoilWetness: 0.62, avgRelativeHumidity: 75, validDaysCount: 341, missingDaysCount: 0 },
  { monthIndex: 5, monthNumber: 6, monthName: "Jun", avgMonthlyRainfallMm: 15.1, avgTemperatureC: 29.2, avgSoilWetness: 0.52, avgRelativeHumidity: 70, validDaysCount: 330, missingDaysCount: 0 },
  { monthIndex: 6, monthNumber: 7, monthName: "Jul", avgMonthlyRainfallMm: 25.4, avgTemperatureC: 28.8, avgSoilWetness: 0.48, avgRelativeHumidity: 68, validDaysCount: 341, missingDaysCount: 0 },
  { monthIndex: 7, monthNumber: 8, monthName: "Aug", avgMonthlyRainfallMm: 45.3, avgTemperatureC: 28.9, avgSoilWetness: 0.49, avgRelativeHumidity: 71, validDaysCount: 341, missingDaysCount: 0 },
  { monthIndex: 8, monthNumber: 9, monthName: "Sep", avgMonthlyRainfallMm: 109.2, avgTemperatureC: 28.5, avgSoilWetness: 0.55, avgRelativeHumidity: 74, validDaysCount: 330, missingDaysCount: 0 },
  { monthIndex: 9, monthNumber: 10, monthName: "Oct", avgMonthlyRainfallMm: 245.8, avgTemperatureC: 27.2, avgSoilWetness: 0.70, avgRelativeHumidity: 82, validDaysCount: 341, missingDaysCount: 0 },
  { monthIndex: 10, monthNumber: 11, monthName: "Nov", avgMonthlyRainfallMm: 285.4, avgTemperatureC: 25.8, avgSoilWetness: 0.85, avgRelativeHumidity: 88, validDaysCount: 330, missingDaysCount: 0 },
  { monthIndex: 11, monthNumber: 12, monthName: "Dec", avgMonthlyRainfallMm: 250.6, avgTemperatureC: 24.8, avgSoilWetness: 0.88, avgRelativeHumidity: 90, validDaysCount: 341, missingDaysCount: 0 },
];

const mockPadaviyaClimate: ProcessedClimateData = {
  coordinates: { latitude: 8.83, longitude: 80.76 },
  dateRange: { startDate: "20150101", endDate: "20251231", yearsAnalyzed: 11 },
  totalDailyRecords: 4018,
  missingRecordsCount: 0,
  climatology: mock12Months,
  seasonalSummary: {
    mahaRainfallMm: 1012.9,
    mahaAvgTempC: 25.4,
    mahaAvgSoilWetness: 0.754,
    yalaRainfallMm: 403.7,
    yalaAvgTempC: 28.2,
    yalaAvgSoilWetness: 0.558,
    annualRainfallMm: 1416.6,
    annualAvgTempC: 27.5,
    annualAvgSoilWetness: 0.645,
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
  waterSuitability: 50,
  soilHealth: 50,
  economicPotential: 0, // Excluded
};

describe("Rotation Engine — Priority Weights Normalization", () => {
  it("normalizes active weights (water + soil) to 1.0", () => {
    const { wWater, wSoil } = normalizeActiveWeights(
      { waterSuitability: 60, soilHealth: 40, economicPotential: 0 },
      true
    );
    expect(wWater + wSoil).toBeCloseTo(1.0);
    expect(wWater).toBe(0.6);
    expect(wSoil).toBe(0.4);
  });

  it("allocates 100% to soil health when water cannot be assessed", () => {
    const { wWater, wSoil } = normalizeActiveWeights(
      { waterSuitability: 50, soilHealth: 50, economicPotential: 0 },
      false
    );
    expect(wWater).toBe(0);
    expect(wSoil).toBe(1.0);
  });
});

describe("Rotation Engine — Error Handling for Unknown Crop ID", () => {
  it("throws an explicit error when given an unknown crop ID and never falls back silently", () => {
    const invalidScenario: RotationScenarioInput = {
      id: "A",
      title: "Invalid Scenario",
      tagline: "Test",
      steps: [
        { seasonId: "maha", seasonName: "Maha", cropId: "unknown_mystery_crop" },
        { seasonId: "yala", seasonName: "Yala", cropId: "rice" },
        { seasonId: "maha", seasonName: "Maha", cropId: "rice" },
      ],
    };

    expect(() =>
      evaluateScenario(invalidScenario, mockPadaviyaClimate, defaultSoil, defaultWeights)
    ).toThrowError(/Unknown crop ID: 'unknown_mystery_crop'/);
  });
});

describe("Rotation Engine — Water Coverage Calculation", () => {
  it("computes water coverage as min(1, rainfall over crop window / midpoint of crop requirement)", () => {
    // Green Gram in Yala (starts April, month index 3).
    // Duration: 60-65 days -> ceil(62.5 / 30) = 3 months: Apr, May, Jun
    // Rainfall in mock: Apr (140.5) + May (68.2) + Jun (15.1) = 223.8 mm
    // Green gram water need midpoint: (228 + 270) / 2 = 249 mm
    // Expected coverage: min(1.0, 223.8 / 249) = ~0.90
    const scenario: RotationScenarioInput = {
      id: "B",
      title: "Green Gram Test",
      tagline: "Test",
      steps: [
        { seasonId: "yala", seasonName: "Yala", cropId: "green_gram" },
        { seasonId: "yala", seasonName: "Yala", cropId: "green_gram" },
        { seasonId: "yala", seasonName: "Yala", cropId: "green_gram" },
      ],
    };

    const result = evaluateScenario(scenario, mockPadaviyaClimate, defaultSoil, defaultWeights);
    expect(result.scores.waterSuitability).toBeCloseTo(0.9, 1);
    expect(result.steps[0].windowRainfallMm).toBe(223.8);
    expect(result.steps[0].cropWaterNeedMidpointMm).toBe(249);
  });

  it("returns 'not assessed' (null) for water suitability if climate data is null, without fallback numbers", () => {
    const scenario = getDefaultScenarios(["rice", "rice", "rice"])[0];
    const result = evaluateScenario(scenario, null, defaultSoil, defaultWeights);

    expect(result.scores.waterSuitability).toBeNull();
    expect(result.dataGaps.some((g) => g.includes("climate data has not loaded"))).toBe(true);
    // Composite score gracefully falls back to soil health alone
    expect(result.scores.compositeScore).toBe(result.scores.soilHealth);
  });

  it("marks crops with null water requirement (Maize, Black Gram) as not assessed and logs data gaps", () => {
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

    // Step 3 (Maize) water coverage is null
    expect(result.steps[2].waterCoverageRatio).toBeNull();
    expect(result.steps[2].cropWaterNeedMidpointMm).toBeNull();

    // Data gap explicitly recorded
    expect(result.dataGaps.some((g) => g.includes("Maize"))).toBe(true);
  });
});

describe("Rotation Engine — Economic Potential Excluded", () => {
  it("marks economic potential as 'not assessed' (null) and excludes it from composite scoring", () => {
    const scenario = getDefaultScenarios(["rice", "rice", "rice"])[0];
    const result = evaluateScenario(scenario, mockPadaviyaClimate, defaultSoil, defaultWeights);

    expect(result.scores.economicPotential).toBeNull();
  });
});

describe("Rotation Engine — Informational Soil pH and Texture", () => {
  it("does not modify soil health score based on unvalidated pH changes", () => {
    const soilNeutral = { ...defaultSoil, ph: 6.5 };
    const soilAcidic = { ...defaultSoil, ph: 4.5 };

    const scenario = getDefaultScenarios(["rice", "rice", "rice"])[0];

    const result1 = evaluateScenario(scenario, mockPadaviyaClimate, soilNeutral, defaultWeights);
    const result2 = evaluateScenario(scenario, mockPadaviyaClimate, soilAcidic, defaultWeights);

    // Soil score remains strictly unaffected by unvalidated pH
    expect(result1.scores.soilHealth).toBe(result2.scores.soilHealth);
    expect(result1.reasons.some((r) => r.includes("do not modify the score"))).toBe(true);
  });
});

describe("Rotation Engine — Sourced Agronomic Rules", () => {
  it("triggers DOA RARDC Kilinochchi warning and severe penalty for continuous cowpea", () => {
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

    const doaWarning = result.risks.find((r) => r.includes("DOA RARDC Kilinochchi warning"));
    expect(doaWarning).toBeDefined();
    expect(doaWarning).toContain("Cowpea should not be grown continuously");
  });

  it("penalizes Cowpea on poorly drained soil based on DOA RARDC Kilinochchi waterlogging source", () => {
    const waterloggedSoil: SoilFormState = {
      ...defaultSoil,
      drainage: "poor_waterlogged",
      drainageConfidence: "measured",
    };

    const cowpeaScenario: RotationScenarioInput = {
      id: "C",
      title: "Cowpea Drainage Test",
      tagline: "Test",
      steps: [
        { seasonId: "maha", seasonName: "Maha", cropId: "rice" },
        { seasonId: "yala", seasonName: "Yala", cropId: "cowpea" },
        { seasonId: "maha", seasonName: "Maha", cropId: "rice" },
      ],
    };

    const result = evaluateScenario(cowpeaScenario, mockPadaviyaClimate, waterloggedSoil, defaultWeights);
    const risk = result.risks.find((r) => r.includes("DOA RARDC Kilinochchi (highly sensitive to waterlogging)"));
    expect(risk).toBeDefined();
  });
});

describe("Rotation Engine — Score Bounds & Determinism", () => {
  it("guarantees scores are between 0.0 and 1.0 (or null if not assessed)", () => {
    const scenarios = getDefaultScenarios(["rice", "rice", "rice"]);
    scenarios.forEach((scen) => {
      const result = evaluateScenario(scen, mockPadaviyaClimate, defaultSoil, defaultWeights);
      if (result.scores.waterSuitability !== null) {
        expect(result.scores.waterSuitability).toBeGreaterThanOrEqual(0.0);
        expect(result.scores.waterSuitability).toBeLessThanOrEqual(1.0);
      }
      expect(result.scores.soilHealth).toBeGreaterThanOrEqual(0.0);
      expect(result.scores.soilHealth).toBeLessThanOrEqual(1.0);
      if (result.scores.compositeScore !== null) {
        expect(result.scores.compositeScore).toBeGreaterThanOrEqual(0.0);
        expect(result.scores.compositeScore).toBeLessThanOrEqual(1.0);
      }
    });
  });
});
