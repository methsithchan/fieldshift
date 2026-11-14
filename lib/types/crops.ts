export type WaterBasis =
  | "total requirement" // Includes land soaking, land preparation, standing water percolation/seepage, and ET
  | "crop water use" // Consumptive evapotranspiration / plant crop water requirement only
  | "unverified"; // Unknown or unmeasured

export interface WaterNeedSpec {
  // Numeric depth in mm: single value, [min, max] range, season-specific { maha, yala }, or null if unmeasured
  value:
    | number
    | [number, number]
    | { maha?: number | [number, number]; yala?: number | [number, number] }
    | null;
  basis: WaterBasis;
  unit: "mm/season";
  soilContext?: string;
  source: string;
  notes?: string;
}

export interface CropMaturitySpec {
  daysRange: [number, number] | null; // [min, max] days
  varietyClasses?: string;
  source: string;
  notes?: string;
}

export interface CropDefinition {
  id: string; // "rice", "green_gram", "cowpea", "black_gram", "maize"
  name: string;
  localName: string;
  botanicalName: string;
  seasons: ("maha" | "yala")[];
  seasonalityNotes: string;
  seasonalitySource: string;

  // Water need with explicit measurement basis
  waterNeed: WaterNeedSpec;

  // Maturity
  maturity: CropMaturitySpec;

  // Botanical & soil interactions
  nitrogenFixing: boolean;
  nitrogenFixingSource: string;

  waterloggingSensitivity: "high" | "moderate" | "low" | "tolerant" | "unverified";
  waterloggingSource: string;

  continuousCroppingRisk: boolean | "unverified";
  continuousCroppingSource: string;

  optimalTemperatureRangeC: [number, number] | null;
  temperatureSource: string;

  soilImpactSummary: string;
  soilImpactSource: string;

  researchStationContext: string;
}
