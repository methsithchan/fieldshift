import { describe, it, expect } from "vitest";
import { computeCropSeasonWindow, computeBestRainWindow } from "@/lib/engine/crop-window";
import { ProcessedClimateData } from "@/lib/types/nasa";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const mockClimate: ProcessedClimateData = {
  coordinates: {
    latitude: 8.83,
    longitude: 80.76,
  },
  dateRange: {
    startDate: "20130101",
    endDate: "20231231",
    yearsAnalyzed: 11,
  },
  totalDailyRecords: 4017,
  missingRecordsCount: 0,
  climatology: monthNames.map((name, idx) => ({
    monthIndex: idx,
    monthNumber: idx + 1,
    monthName: name,
    avgMonthlyRainfallMm: [80, 40, 50, 120, 60, 20, 30, 40, 70, 220, 280, 190][idx],
    avgTemperatureC: 28,
    avgSoilWetness: 0.5,
    avgRelativeHumidity: 75,
    validDaysCount: 30,
    missingDaysCount: 0,
  })),
  seasonalSummary: {
    mahaRainfallMm: 800,
    mahaAvgTempC: 27,
    mahaAvgSoilWetness: 0.6,
    yalaRainfallMm: 350,
    yalaAvgTempC: 29,
    yalaAvgSoilWetness: 0.4,
    annualRainfallMm: 1150,
    annualAvgTempC: 28,
    annualAvgSoilWetness: 0.5,
  },
  rawSample: [],
  fetchedAt: new Date().toISOString(),
};

describe("computeCropSeasonWindow & computeBestRainWindow", () => {
  it("computes rice Maha and Yala windows correctly", () => {
    const resMaha = computeCropSeasonWindow("rice", "maha", mockClimate);
    expect(resMaha.cropId).toBe("rice");
    expect(resMaha.sowingStartMonth).toBe(10);
    expect(resMaha.sowingStartDay).toBe(22);
    expect(resMaha.windowRainfallMm).toBeGreaterThan(400);
    expect(resMaha.cropWaterNeedMm).toBe(1090);
    expect(resMaha.waterCoverageRatio).toBeGreaterThan(0.4);
    expect(resMaha.isUnverifiedWaterNeed).toBe(false);

    const best = computeBestRainWindow("rice", mockClimate);
    expect(best.strongestSeason.seasonId).toBe("maha");
  });

  it("handles unverified water requirements for maize and black gram without crashing", () => {
    const maizeRes = computeCropSeasonWindow("maize", "maha", mockClimate);
    expect(maizeRes.isUnverifiedWaterNeed).toBe(true);
    expect(maizeRes.cropWaterNeedMm).toBeNull();
    expect(maizeRes.waterCoverageRatio).toBeNull();
    expect(maizeRes.windowRainfallMm).toBeGreaterThan(400);

    const best = computeBestRainWindow("maize", mockClimate);
    expect(best.hasVerifiedWaterNeed).toBe(false);
    expect(best.strongestSeason.seasonId).toBe("maha");
  });

  it("computes green gram and cowpea coverage accurately", () => {
    const ggMaha = computeCropSeasonWindow("green_gram", "maha", mockClimate);
    expect(ggMaha.cropWaterNeedMm).toBe(228);
    expect(ggMaha.waterCoverageRatio).toBe(1.0); // capped at 1.0

    const cowpeaYala = computeCropSeasonWindow("cowpea", "yala", mockClimate);
    expect(cowpeaYala.cropWaterNeedMm).toBe(231.5);
    expect(cowpeaYala.windowRainfallMm).toBeGreaterThan(50);
  });
});
