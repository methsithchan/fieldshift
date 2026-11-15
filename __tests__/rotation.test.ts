import { describe, it, expect } from "vitest";
import {
  evaluateScenario,
  evaluateAllScenarios,
  getDefaultScenarios,
  normalizeActiveWeights,
  getCropWaterNeedForSeason,
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
  rainfallCoverage: 50,
  soilHealth: 50,
  economicPotential: 0, // Excluded
};

describe("Rotation Engine — Priority Weights Normalization", () => {
  it("normalizes active weights (rainfallCoverage + soil) to 1.0", () => {
    const { wRainfall, wSoil } = normalizeActiveWeights(
      { rainfallCoverage: 60, soilHealth: 40, economicPotential: 0 },
      true
    );
    expect(wRainfall + wSoil).toBeCloseTo(1.0);
    expect(wRainfall).toBe(0.6);
    expect(wSoil).toBe(0.4);
  });

  it("allocates 100% to soil health when rainfall coverage cannot be assessed", () => {
    const { wRainfall, wSoil } = normalizeActiveWeights(
      { rainfallCoverage: 50, soilHealth: 50, economicPotential: 0 },
      false
    );
    expect(wRainfall).toBe(0);
    expect(wSoil).toBe(1.0);
  });
});

describe("Rotation Engine — Green Gram Season-Specific Requirement", () => {
  it("resolves season-specific water requirement for green gram (228 mm Maha, 270 mm Yala)", () => {
    const mahaNeed = getCropWaterNeedForSeason(CROPS.green_gram, "maha");
    const yalaNeed = getCropWaterNeedForSeason(CROPS.green_gram, "yala");

    expect(mahaNeed).toBe(228);
    expect(yalaNeed).toBe(270);
  });
});

describe("Rotation Engine — Partial Rainfall Coverage Handling", () => {
  it("marks a scenario with unverified crops as 'partial' and displays assessed seasons count", () => {
    // Strategy C has Rice, Cowpea, and Maize (Maize water need is null)
    const strategyC = getDefaultScenarios(["rice", "rice", "rice"])[2];
    const result = evaluateScenario(strategyC, mockPadaviyaClimate, defaultSoil, defaultWeights);

    expect(result.scores.rainfallCoverageStatus).toBe("partial");
    expect(result.scores.rainfallCoverageAssessedCount).toBe(2);
    expect(result.scores.rainfallCoverage).not.toBeNull();

    // An explicit note explaining partial coverage must be included
    expect(
      result.reasons.some((r) => r.includes("assessed for 2 of 3 seasons only"))
    ).toBe(true);
  });

  it("marks fully assessed scenario as 'full' with 3 of 3 seasons assessed", () => {
    // Strategy B has Rice (Maha), Green Gram (Yala), Rice (Maha) - all have verified water requirements
    const strategyB = getDefaultScenarios(["rice", "rice", "rice"])[1];
    const result = evaluateScenario(strategyB, mockPadaviyaClimate, defaultSoil, defaultWeights);

    expect(result.scores.rainfallCoverageStatus).toBe("full");
    expect(result.scores.rainfallCoverageAssessedCount).toBe(3);
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

describe("Rotation Engine — Rainfall Coverage Calculation", () => {
  it("computes water coverage using day-offset growth window (sowing start day + duration days)", () => {
    // Green Gram in Yala (starts ~7 Apr / Apr wk1-2 per operations_timeline.csv, month index 3).
    // Duration: 55-65 days (Crop Book p. 8) -> midpoint 60 days -> 60 / 30 = 2.0 months
    // In mock: Apr 24 days (24/30 * 140.5 = 112.4) + May 31 days (68.2) + Jun 5 days (5/30 * 15.1 = 2.52)
    // Total window rain = 112.4 + 68.2 + 2.5167 = 183.1 mm
    // Green gram Yala water need: 270 mm
    // Expected coverage: min(1.0, 183.1 / 270) = ~0.68
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
    expect(result.scores.rainfallCoverage).toBeCloseTo(0.68, 2);
    expect(result.steps[0].windowRainfallMm).toBe(183.1);
    expect(result.steps[0].windowMonthsCount).toBe(2.0);
    expect(result.steps[0].cropWaterNeedMidpointMm).toBe(270);
  });

  it("returns 'not assessed' (null) for rainfall coverage if climate data is null, without fallback numbers", () => {
    const scenario = getDefaultScenarios(["rice", "rice", "rice"])[0];
    const result = evaluateScenario(scenario, null, defaultSoil, defaultWeights);

    expect(result.scores.rainfallCoverage).toBeNull();
    expect(result.scores.rainfallCoverageStatus).toBe("not_assessed");
    expect(result.dataGaps.some((g) => g.includes("climate data has not loaded"))).toBe(true);
    // Composite score gracefully falls back to soil health alone
    expect(result.scores.compositeScore).toBe(result.scores.soilHealth);
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

  it("does not apply both monoculture and consecutive-cowpea penalties to the same rotation", () => {
    const cowpeaMonoculture: RotationScenarioInput = {
      id: "A",
      title: "Cowpea Monoculture",
      tagline: "Test",
      steps: [
        { seasonId: "maha", seasonName: "Maha", cropId: "cowpea" },
        { seasonId: "yala", seasonName: "Yala", cropId: "cowpea" },
        { seasonId: "maha", seasonName: "Maha", cropId: "cowpea" },
      ],
    };

    const result = evaluateScenario(
      cowpeaMonoculture,
      mockPadaviyaClimate,
      defaultSoil,
      defaultWeights
    );

    // Monoculture penalty applies (-0.25), but NOT consecutive cowpea (-0.35)
    expect(result.risks.some((r) => r.includes("monoculture"))).toBe(true);
    expect(result.risks.some((r) => r.includes("may increase pest carryover"))).toBe(true);
    expect(result.risks.some((r) => r.includes("DOA RARDC Kilinochchi warning"))).toBe(false);
    // Baseline 0.60 - 0.25 (monoculture) + 3*0.12 (legume bonus 0.36) = 0.71
    expect(result.scores.soilHealth).toBe(0.71);
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
      if (result.scores.rainfallCoverage !== null) {
        expect(result.scores.rainfallCoverage).toBeGreaterThanOrEqual(0.0);
        expect(result.scores.rainfallCoverage).toBeLessThanOrEqual(1.0);
      }
      expect(result.scores.soilHealth).toBeGreaterThanOrEqual(0.0);
      expect(result.scores.soilHealth).toBeLessThanOrEqual(1.0);
      if (result.scores.compositeScore !== null) {
        expect(result.scores.compositeScore).toBeGreaterThanOrEqual(0.0);
        expect(result.scores.compositeScore).toBeLessThanOrEqual(1.0);
      }
    });
  });

  it("produces different rainfall coverage scores when location changes (Padaviya vs Mahailluppallama)", () => {
    // Mahailluppallama has higher rainfall in Yala (590 mm vs 441 mm)
    const mockMahailluppallamaClimate: ProcessedClimateData = {
      ...mockPadaviyaClimate,
      coordinates: { latitude: 8.11, longitude: 80.46 },
      climatology: mockPadaviyaClimate.climatology.map((m) => ({
        ...m,
        // Mahailluppallama experiences higher precipitation
        avgMonthlyRainfallMm: m.avgMonthlyRainfallMm !== null ? Number((m.avgMonthlyRainfallMm * 1.25).toFixed(1)) : null,
      })),
      seasonalSummary: {
        ...mockPadaviyaClimate.seasonalSummary,
        mahaRainfallMm: 1126.5,
        yalaRainfallMm: 590.5,
      },
    };

    const scenario = getDefaultScenarios(["rice", "rice", "rice"])[0]; // Rice -> Rice -> Rice
    const padaviyaResult = evaluateScenario(scenario, mockPadaviyaClimate, defaultSoil, defaultWeights);
    const mahailluppallamaResult = evaluateScenario(scenario, mockMahailluppallamaClimate, defaultSoil, defaultWeights);

    expect(padaviyaResult.scores.rainfallCoverage).not.toEqual(mahailluppallamaResult.scores.rainfallCoverage);
    expect(mahailluppallamaResult.scores.rainfallCoverage!).toBeGreaterThan(padaviyaResult.scores.rainfallCoverage!);
  });

  it("applies operations_timeline.csv sowing timings and displays approximate sowing time in evidence text", () => {
    const strategyB = getDefaultScenarios(["rice", "rice", "rice"])[1]; // Rice -> Green Gram -> Rice
    const result = evaluateScenario(strategyB, mockPadaviyaClimate, defaultSoil, defaultWeights);

    // Rice Maha: October (source: p. 1)
    expect(result.steps[0].sowingTiming?.startMonth).toBe(10);
    expect(result.reasons.some((r) => r.includes("approximate sowing time: Nov (2.5 & 3 mo); 3.5 mo nursery Oct wk3-4"))).toBe(true);

    // Green Gram Yala: April (source: p. 8)
    expect(result.steps[1].sowingTiming?.startMonth).toBe(4);
    expect(result.reasons.some((r) => r.includes("approximate sowing time: Apr wk1-2"))).toBe(true);
  });

  it("includes 'Recommended in Anuradhapura (all zones)' evidence line for listed crops", () => {
    const strategyC = getDefaultScenarios(["rice", "rice", "rice"])[2]; // Rice -> Cowpea -> Maize
    const result = evaluateScenario(strategyC, mockPadaviyaClimate, defaultSoil, defaultWeights);

    // Cowpea and Maize are both recommended in Anuradhapura all zones
    expect(result.reasons.some((r) => r.includes("Cowpea: Recommended in Anuradhapura (all zones)"))).toBe(true);
    expect(result.reasons.some((r) => r.includes("Maize (Corn): Recommended in Anuradhapura (all zones)"))).toBe(true);
  });
});
