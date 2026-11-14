import {
  NasaPowerRawResponse,
  ProcessedClimateData,
  MonthlyClimatology,
  SeasonalSummary,
  DailySampleRecord,
} from "@/lib/types/nasa";
import { CULTIVATION_SEASONS } from "@/data/seasons";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Sanitizes a NASA POWER numeric value.
 * Values equal to fill_value (-999 or similar <= -900) are treated as null.
 */
export function sanitizeValue(val: number | undefined | null, fillValue = -999.0): number | null {
  if (val === undefined || val === null) return null;
  if (val <= -900 || val === fillValue) return null;
  return val;
}

/**
 * Processes raw NASA POWER point data into multi-year monthly climatology and seasonal aggregates.
 */
export function processNasaClimateData(
  raw: NasaPowerRawResponse,
  lat: number,
  lon: number,
  startDateStr: string,
  endDateStr: string
): ProcessedClimateData {
  const fillValue = raw.header?.fill_value ?? -999.0;
  const precip = raw.properties?.parameter?.PRECTOTCORR ?? {};
  const temp = raw.properties?.parameter?.T2M ?? {};
  const rh = raw.properties?.parameter?.RH2M ?? {};
  const gwet = raw.properties?.parameter?.GWETROOT ?? {};

  // All unique dates in chronological order
  const allDateKeys = Object.keys(precip).sort();

  // Buckets by [monthIndex 0-11][yearString] for monthly accumulation & averaging
  // For rainfall: monthly total = sum of daily mm in that month-year
  // For temp/gwet/rh: monthly mean = avg of daily values in that month-year
  interface MonthYearAccumulator {
    rainfallDailySum: number;
    rainfallDays: number;
    tempSum: number;
    tempDays: number;
    gwetSum: number;
    gwetDays: number;
    rhSum: number;
    rhDays: number;
  }

  // Map: `${year}-${monthIndex}` => MonthYearAccumulator
  const monthYearMap = new Map<string, MonthYearAccumulator>();
  const uniqueYears = new Set<string>();

  let totalDailyRecords = 0;
  let missingRecordsCount = 0;
  const rawSample: DailySampleRecord[] = [];

  for (const dateKey of allDateKeys) {
    if (dateKey.length !== 8) continue;
    totalDailyRecords++;

    const year = dateKey.substring(0, 4);
    const month = parseInt(dateKey.substring(4, 6), 10) - 1; // 0-indexed
    uniqueYears.add(year);

    const r = sanitizeValue(precip[dateKey], fillValue);
    const t = sanitizeValue(temp[dateKey], fillValue);
    const h = sanitizeValue(rh[dateKey], fillValue);
    const g = sanitizeValue(gwet[dateKey], fillValue);

    if (r === null || t === null || g === null) {
      missingRecordsCount++;
    }

    if (rawSample.length < 5) {
      rawSample.push({
        date: `${year}-${dateKey.substring(4, 6)}-${dateKey.substring(6, 8)}`,
        rawDate: dateKey,
        rainfallMm: r !== null ? Number(r.toFixed(2)) : null,
        temperatureC: t !== null ? Number(t.toFixed(2)) : null,
        relativeHumidity: h !== null ? Number(h.toFixed(1)) : null,
        soilWetness: g !== null ? Number(g.toFixed(3)) : null,
      });
    }

    const myKey = `${year}-${month}`;
    let acc = monthYearMap.get(myKey);
    if (!acc) {
      acc = {
        rainfallDailySum: 0,
        rainfallDays: 0,
        tempSum: 0,
        tempDays: 0,
        gwetSum: 0,
        gwetDays: 0,
        rhSum: 0,
        rhDays: 0,
      };
      monthYearMap.set(myKey, acc);
    }

    if (r !== null) {
      acc.rainfallDailySum += r;
      acc.rainfallDays++;
    }
    if (t !== null) {
      acc.tempSum += t;
      acc.tempDays++;
    }
    if (g !== null) {
      acc.gwetSum += g;
      acc.gwetDays++;
    }
    if (h !== null) {
      acc.rhSum += h;
      acc.rhDays++;
    }
  }

  // Calculate 12-month climatology
  const climatology: MonthlyClimatology[] = [];

  for (let m = 0; m < 12; m++) {
    const monthlyRainfallTotals: number[] = [];
    const monthlyAvgTemps: number[] = [];
    const monthlyAvgGwets: number[] = [];
    const monthlyAvgRhs: number[] = [];
    let validDays = 0;
    let missingDays = 0;

    for (const year of uniqueYears) {
      const acc = monthYearMap.get(`${year}-${m}`);
      if (acc && acc.rainfallDays >= 20) {
        // Representative month with at least 20 daily records
        monthlyRainfallTotals.push(acc.rainfallDailySum);
        if (acc.tempDays > 0) monthlyAvgTemps.push(acc.tempSum / acc.tempDays);
        if (acc.gwetDays > 0) monthlyAvgGwets.push(acc.gwetSum / acc.gwetDays);
        if (acc.rhDays > 0) monthlyAvgRhs.push(acc.rhSum / acc.rhDays);
        validDays += acc.rainfallDays;
      } else {
        missingDays += 30;
      }
    }

    const avgRainfall =
      monthlyRainfallTotals.length > 0
        ? Number(
            (
              monthlyRainfallTotals.reduce((a, b) => a + b, 0) / monthlyRainfallTotals.length
            ).toFixed(1)
          )
        : null;

    const avgTemp =
      monthlyAvgTemps.length > 0
        ? Number(
            (monthlyAvgTemps.reduce((a, b) => a + b, 0) / monthlyAvgTemps.length).toFixed(1)
          )
        : null;

    const avgGwet =
      monthlyAvgGwets.length > 0
        ? Number(
            (monthlyAvgGwets.reduce((a, b) => a + b, 0) / monthlyAvgGwets.length).toFixed(3)
          )
        : null;

    const avgRh =
      monthlyAvgRhs.length > 0
        ? Number((monthlyAvgRhs.reduce((a, b) => a + b, 0) / monthlyAvgRhs.length).toFixed(1))
        : null;

    climatology.push({
      monthIndex: m,
      monthNumber: m + 1,
      monthName: MONTH_NAMES[m],
      avgMonthlyRainfallMm: avgRainfall,
      avgTemperatureC: avgTemp,
      avgSoilWetness: avgGwet,
      avgRelativeHumidity: avgRh,
      validDaysCount: validDays,
      missingDaysCount: missingDays,
    });
  }

  // Calculate Sri Lanka seasonal summaries using definitions from data/seasons.ts
  const mahaConfig = CULTIVATION_SEASONS.find((s) => s.id === "maha");
  const yalaConfig = CULTIVATION_SEASONS.find((s) => s.id === "yala");

  // Convert 1-indexed months (1-12) to 0-indexed month indices (0-11)
  const mahaMonthIndices = (mahaConfig?.months ?? [10, 11, 12, 1, 2, 3]).map((m) => m - 1);
  const yalaMonthIndices = (yalaConfig?.months ?? [4, 5, 6, 7, 8, 9]).map((m) => m - 1);

  // Helper for summing nullable numbers
  const sumNullable = (indices: number[], getter: (c: MonthlyClimatology) => number | null): number | null => {
    let sum = 0;
    let count = 0;
    for (const idx of indices) {
      const v = getter(climatology[idx]);
      if (v !== null) {
        sum += v;
        count++;
      }
    }
    return count > 0 ? Number(sum.toFixed(1)) : null;
  };

  const avgNullable = (indices: number[], getter: (c: MonthlyClimatology) => number | null, decimals = 1): number | null => {
    let sum = 0;
    let count = 0;
    for (const idx of indices) {
      const v = getter(climatology[idx]);
      if (v !== null) {
        sum += v;
        count++;
      }
    }
    return count > 0 ? Number((sum / count).toFixed(decimals)) : null;
  };

  const mahaRainfall = sumNullable(mahaMonthIndices, (c) => c.avgMonthlyRainfallMm);
  const mahaTemp = avgNullable(mahaMonthIndices, (c) => c.avgTemperatureC, 1);
  const mahaSoilWetness = avgNullable(mahaMonthIndices, (c) => c.avgSoilWetness, 3);

  const yalaRainfall = sumNullable(yalaMonthIndices, (c) => c.avgMonthlyRainfallMm);
  const yalaTemp = avgNullable(yalaMonthIndices, (c) => c.avgTemperatureC, 1);
  const yalaSoilWetness = avgNullable(yalaMonthIndices, (c) => c.avgSoilWetness, 3);

  const allIndices = Array.from({ length: 12 }, (_, i) => i);
  const annualRainfall = sumNullable(allIndices, (c) => c.avgMonthlyRainfallMm);
  const annualAvgTemp = avgNullable(allIndices, (c) => c.avgTemperatureC, 1);
  const annualAvgSoilWetness = avgNullable(allIndices, (c) => c.avgSoilWetness, 3);

  const seasonalSummary: SeasonalSummary = {
    mahaRainfallMm: mahaRainfall,
    mahaAvgTempC: mahaTemp,
    mahaAvgSoilWetness: mahaSoilWetness,

    yalaRainfallMm: yalaRainfall,
    yalaAvgTempC: yalaTemp,
    yalaAvgSoilWetness: yalaSoilWetness,

    annualRainfallMm: annualRainfall,
    annualAvgTempC: annualAvgTemp,
    annualAvgSoilWetness: annualAvgSoilWetness,
  };

  return {
    coordinates: {
      latitude: lat,
      longitude: lon,
      elevationMeters: raw.geometry?.coordinates?.[2],
    },
    dateRange: {
      startDate: startDateStr,
      endDate: endDateStr,
      yearsAnalyzed: uniqueYears.size,
    },
    totalDailyRecords,
    missingRecordsCount,
    climatology,
    seasonalSummary,
    rawSample,
    fetchedAt: new Date().toISOString(),
  };
}
