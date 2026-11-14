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
        ? monthlyRainfallTotals.reduce((a, b) => a + b, 0) / monthlyRainfallTotals.length
        : 0;

    const avgTemp =
      monthlyAvgTemps.length > 0
        ? monthlyAvgTemps.reduce((a, b) => a + b, 0) / monthlyAvgTemps.length
        : 0;

    const avgGwet =
      monthlyAvgGwets.length > 0
        ? monthlyAvgGwets.reduce((a, b) => a + b, 0) / monthlyAvgGwets.length
        : 0;

    const avgRh =
      monthlyAvgRhs.length > 0
        ? monthlyAvgRhs.reduce((a, b) => a + b, 0) / monthlyAvgRhs.length
        : 0;

    climatology.push({
      monthIndex: m,
      monthNumber: m + 1,
      monthName: MONTH_NAMES[m],
      avgMonthlyRainfallMm: Number(avgRainfall.toFixed(1)),
      avgTemperatureC: Number(avgTemp.toFixed(1)),
      avgSoilWetness: Number(avgGwet.toFixed(3)),
      avgRelativeHumidity: Number(avgRh.toFixed(1)),
      validDaysCount: validDays,
      missingDaysCount: missingDays,
    });
  }

  // Calculate Sri Lanka seasonal summaries using definitions from data/seasons.ts
  const mahaConfig = CULTIVATION_SEASONS.find((s) => s.id === "maha");
  const yalaConfig = CULTIVATION_SEASONS.find((s) => s.id === "yala");

  // Convert 1-indexed months (1-12) to 0-indexed month indices (0-11)
  const mahaMonthIndices = (mahaConfig?.months ?? [10, 11, 12, 1, 2]).map((m) => m - 1);
  const yalaMonthIndices = (yalaConfig?.months ?? [4, 5, 6, 7, 8]).map((m) => m - 1);

  const mahaRainfall = mahaMonthIndices.reduce((sum, m) => sum + climatology[m].avgMonthlyRainfallMm, 0);
  const mahaTemp =
    mahaMonthIndices.length > 0
      ? mahaMonthIndices.reduce((sum, m) => sum + climatology[m].avgTemperatureC, 0) / mahaMonthIndices.length
      : 0;
  const mahaSoilWetness =
    mahaMonthIndices.length > 0
      ? mahaMonthIndices.reduce((sum, m) => sum + climatology[m].avgSoilWetness, 0) / mahaMonthIndices.length
      : 0;

  const yalaRainfall = yalaMonthIndices.reduce((sum, m) => sum + climatology[m].avgMonthlyRainfallMm, 0);
  const yalaTemp =
    yalaMonthIndices.length > 0
      ? yalaMonthIndices.reduce((sum, m) => sum + climatology[m].avgTemperatureC, 0) / yalaMonthIndices.length
      : 0;
  const yalaSoilWetness =
    yalaMonthIndices.length > 0
      ? yalaMonthIndices.reduce((sum, m) => sum + climatology[m].avgSoilWetness, 0) / yalaMonthIndices.length
      : 0;

  // Annual
  const annualRainfall = climatology.reduce((sum, c) => sum + c.avgMonthlyRainfallMm, 0);
  const annualAvgTemp =
    climatology.reduce((sum, c) => sum + c.avgTemperatureC, 0) / climatology.length;
  const annualAvgSoilWetness =
    climatology.reduce((sum, c) => sum + c.avgSoilWetness, 0) / climatology.length;

  const seasonalSummary: SeasonalSummary = {
    mahaRainfallMm: Number(mahaRainfall.toFixed(1)),
    mahaAvgTempC: Number(mahaTemp.toFixed(1)),
    mahaAvgSoilWetness: Number(mahaSoilWetness.toFixed(3)),

    yalaRainfallMm: Number(yalaRainfall.toFixed(1)),
    yalaAvgTempC: Number(yalaTemp.toFixed(1)),
    yalaAvgSoilWetness: Number(yalaSoilWetness.toFixed(3)),

    annualRainfallMm: Number(annualRainfall.toFixed(1)),
    annualAvgTempC: Number(annualAvgTemp.toFixed(1)),
    annualAvgSoilWetness: Number(annualAvgSoilWetness.toFixed(3)),
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
