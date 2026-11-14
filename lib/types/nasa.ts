// Type definitions for NASA POWER API and climate processing

export interface NasaPowerRawParameter {
  [dateStr: string]: number; // dateStr is YYYYMMDD
}

export interface NasaPowerRawResponse {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number, number]; // [lon, lat, elevation]
  };
  properties: {
    parameter: {
      PRECTOTCORR?: NasaPowerRawParameter;
      T2M?: NasaPowerRawParameter;
      RH2M?: NasaPowerRawParameter;
      GWETROOT?: NasaPowerRawParameter;
      [key: string]: NasaPowerRawParameter | undefined;
    };
  };
  header: {
    title: string;
    api: {
      version: string;
      name: string;
    };
    sources: string[];
    fill_value: number; // typically -999.0
    time_standard: string;
    start: string;
    end: string;
  };
  messages: string[];
  parameters: {
    [key: string]: {
      units: string;
      longname: string;
    };
  };
}

export interface MonthlyClimatology {
  monthIndex: number; // 0-11
  monthNumber: number; // 1-12
  monthName: string; // "Jan", "Feb", etc.
  avgMonthlyRainfallMm: number; // average total precipitation for that month across years
  avgTemperatureC: number; // mean temperature for that month across years
  avgSoilWetness: number; // mean GWETROOT (0-1) across years
  avgRelativeHumidity: number; // mean RH2M (%) across years
  validDaysCount: number;
  missingDaysCount: number;
}

export interface SeasonalSummary {
  // Maha season: typically October through February (major cultivation season in Sri Lanka dry zone)
  mahaRainfallMm: number;
  mahaAvgTempC: number;
  mahaAvgSoilWetness: number;

  // Yala season: typically April through August (minor/dry cultivation season in Sri Lanka dry zone)
  yalaRainfallMm: number;
  yalaAvgTempC: number;
  yalaAvgSoilWetness: number;

  // Annual
  annualRainfallMm: number;
  annualAvgTempC: number;
  annualAvgSoilWetness: number;
}

export interface DailySampleRecord {
  date: string; // YYYY-MM-DD
  rawDate: string; // YYYYMMDD
  rainfallMm: number | null;
  temperatureC: number | null;
  relativeHumidity: number | null;
  soilWetness: number | null;
}

export interface ProcessedClimateData {
  coordinates: {
    latitude: number;
    longitude: number;
    elevationMeters?: number;
  };
  dateRange: {
    startDate: string; // YYYYMMDD
    endDate: string; // YYYYMMDD
    yearsAnalyzed: number;
  };
  totalDailyRecords: number;
  missingRecordsCount: number;
  climatology: MonthlyClimatology[]; // 12 elements (Jan-Dec)
  seasonalSummary: SeasonalSummary;
  rawSample: DailySampleRecord[]; // first 5-10 records for transparency/verification
  fetchedAt: string;
}
