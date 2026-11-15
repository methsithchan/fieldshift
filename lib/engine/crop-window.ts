import { CropDefinition } from "@/lib/types/crops";
import { ProcessedClimateData } from "@/lib/types/nasa";
import { CROPS } from "@/data/crops";
import { CULTIVATION_SEASONS } from "@/data/seasons";
import { MODEL_ASSUMPTIONS } from "./assumptions";
import {
  getCropSowingTiming,
  ANURADHAPURA_RECOMMENDED_CROPS,
  CLIMATE_HAZARD_ADVICE,
} from "@/data/crop_sourcing";
import { getCropWaterNeedForSeason } from "./rotation";

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export interface CropSeasonWindow {
  cropId: string;
  cropName: string;
  seasonId: "maha" | "yala";
  seasonName: string;
  sowingTimingText: string;
  sowingStartDay: number;
  sowingStartMonth: number;
  maturityDays: number;
  windowRainfallMm: number | null;
  cropWaterNeedMm: number | null;
  waterCoverageRatio: number | null; // e.g. 1.0 (100%), 0.74 (74%), or null
  isUnverifiedWaterNeed: boolean;
  waterBasis: string | null;
  confidence: string;
}

export interface BestRainWindowAnalysis {
  cropId: string;
  cropName: string;
  strongestSeason: CropSeasonWindow;
  otherSeason: CropSeasonWindow;
  maha: CropSeasonWindow;
  yala: CropSeasonWindow;
  hasVerifiedWaterNeed: boolean;
}

/**
 * Computes the growth window rainfall and water coverage ratio for a single crop in a given season.
 */
export function computeCropSeasonWindow(
  cropId: string,
  seasonId: "maha" | "yala",
  climate: ProcessedClimateData | null
): CropSeasonWindow {
  const crop = CROPS[cropId];
  if (!crop) {
    throw new Error(`Unknown cropId: ${cropId}`);
  }

  const seasonConfig = CULTIVATION_SEASONS.find((s) => s.id === seasonId);
  const seasonName = seasonConfig ? seasonConfig.name : seasonId === "maha" ? "Maha Season" : "Yala Season";

  const sowingTiming = getCropSowingTiming(cropId, seasonId);
  const maturityDays = sowingTiming.durationDays
    ? sowingTiming.durationDays
    : crop.maturity.daysRange
    ? (crop.maturity.daysRange[0] + crop.maturity.daysRange[1]) / 2
    : 90;

  const needMidpoint = getCropWaterNeedForSeason(crop, seasonId);
  const isUnverified = needMidpoint === null;
  const waterBasis = crop.waterNeed.basis;

  let windowRainfallMm: number | null = null;
  let waterCoverageRatio: number | null = null;

  if (climate && climate.climatology && climate.climatology.length >= 12) {
    let windowRainfallSum = 0;
    let windowHasNull = false;
    let remainingDays = maturityDays;
    let currMonth0 = (sowingTiming.startMonth - 1) % 12;

    // First month: days from startDay to end of month
    const daysInFirstMonth = DAYS_IN_MONTH[currMonth0];
    const daysAvailFirst = Math.max(1, daysInFirstMonth - sowingTiming.startDay + 1);
    const daysUsedFirst = Math.min(remainingDays, daysAvailFirst);
    const mDataFirst = climate.climatology[currMonth0];

    if (mDataFirst.avgMonthlyRainfallMm === null) {
      windowHasNull = true;
    } else {
      windowRainfallSum += (daysUsedFirst / daysInFirstMonth) * mDataFirst.avgMonthlyRainfallMm;
    }
    remainingDays -= daysUsedFirst;
    currMonth0 = (currMonth0 + 1) % 12;

    // Subsequent consecutive months
    while (remainingDays > 0.001) {
      const daysInThisMonth = DAYS_IN_MONTH[currMonth0];
      const daysUsed = Math.min(remainingDays, daysInThisMonth);
      const mData = climate.climatology[currMonth0];

      if (mData.avgMonthlyRainfallMm === null) {
        windowHasNull = true;
      } else {
        windowRainfallSum += (daysUsed / daysInThisMonth) * mData.avgMonthlyRainfallMm;
      }
      remainingDays -= daysUsed;
      currMonth0 = (currMonth0 + 1) % 12;
    }

    if (!windowHasNull) {
      windowRainfallMm = Number(windowRainfallSum.toFixed(1));
      if (!isUnverified && needMidpoint > 0) {
        const coverage = Math.min(
          MODEL_ASSUMPTIONS.RAINFALL_COVERAGE_CAP.value,
          windowRainfallMm / needMidpoint
        );
        waterCoverageRatio = Number(coverage.toFixed(2));
      }
    }
  }

  return {
    cropId,
    cropName: crop.name,
    seasonId,
    seasonName,
    sowingTimingText: sowingTiming.approxTiming,
    sowingStartDay: sowingTiming.startDay,
    sowingStartMonth: sowingTiming.startMonth,
    maturityDays,
    windowRainfallMm,
    cropWaterNeedMm: needMidpoint,
    waterCoverageRatio,
    isUnverifiedWaterNeed: isUnverified,
    waterBasis,
    confidence: sowingTiming.confidence,
  };
}

/**
 * Computes both Maha and Yala windows for a crop and identifies the strongest rain-supported window.
 */
export function computeBestRainWindow(
  cropId: string,
  climate: ProcessedClimateData | null
): BestRainWindowAnalysis {
  const maha = computeCropSeasonWindow(cropId, "maha", climate);
  const yala = computeCropSeasonWindow(cropId, "yala", climate);

  let strongestSeason: CropSeasonWindow;
  let otherSeason: CropSeasonWindow;

  const hasVerified = !maha.isUnverifiedWaterNeed && !yala.isUnverifiedWaterNeed;

  if (hasVerified && maha.waterCoverageRatio !== null && yala.waterCoverageRatio !== null) {
    if (maha.waterCoverageRatio >= yala.waterCoverageRatio) {
      strongestSeason = maha;
      otherSeason = yala;
    } else {
      strongestSeason = yala;
      otherSeason = maha;
    }
  } else {
    // Compare window rainfall mm if coverage ratio is null/unverified
    const mahaRain = maha.windowRainfallMm ?? 0;
    const yalaRain = yala.windowRainfallMm ?? 0;
    if (mahaRain >= yalaRain) {
      strongestSeason = maha;
      otherSeason = yala;
    } else {
      strongestSeason = yala;
      otherSeason = maha;
    }
  }

  return {
    cropId,
    cropName: maha.cropName,
    strongestSeason,
    otherSeason,
    maha,
    yala,
    hasVerifiedWaterNeed: hasVerified,
  };
}
