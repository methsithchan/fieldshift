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
  avgMonthlyRainfallMm: number | null; // average total precipitation for that month across years, null if no valid data
  avgTemperatureC: number | null; // mean temperature for that month across years, null if no valid data
  avgSoilWetness: number | null; // mean GWETROOT (0-1) across years, null if no valid data
  avgRelativeHumidity: number | null; // mean RH2M (%) across years, null if no valid data
  validDaysCount: number;
  missingDaysCount: number;
}

export interface SeasonalSummary {
  // Maha season: October through March (FAO Sri Lanka Crop Calendar)
  mahaRainfallMm: number | null;
  mahaAvgTempC: number | null;
  mahaAvgSoilWetness: number | null;

  // Yala season: April through September (FAO Sri Lanka Crop Calendar)
  yalaRainfallMm: number | null;
  yalaAvgTempC: number | null;
  yalaAvgSoilWetness: number | null;

  // Annual
  annualRainfallMm: number | null;
  annualAvgTempC: number | null;
  annualAvgSoilWetness: number | null;
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
