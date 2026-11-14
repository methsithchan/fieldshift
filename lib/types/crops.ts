export type WaterBasis =
  | "total requirement" // Includes land soaking, land preparation, standing water percolation/seepage, and ET
  | "crop water use" // Consumptive evapotranspiration / plant crop water requirement only
  | "irrigation need" // Supplementary irrigation depth required above effective rainfall
  | "unverified"; // Unknown or unmeasured

export interface WaterNeedSpec {
  // Numeric depth in mm: single value, or [min, max] range across soil types / durations, or null if unmeasured
  value: number | [number, number] | null;
  basis: WaterBasis;
  unit: "mm/season";
  soilContext?: string; // e.g. "Low Humic Gley vs Reddish Brown Earths"
  source: string;
  notes?: string;
}

export interface CropMaturitySpec {
  daysRange: [number, number] | null; // [min, max] days
  varietyClasses?: string; // e.g., "ultra-short (<90d), short (90-99d), medium (100-109d), long (110-135d)"
  source: string;
  notes?: string;
}

export interface CropDefinition {
  id: string; // "rice", "green_gram", "cowpea", "black_gram", "maize"
  name: string; // e.g., "Rice (Paddy)"
  localName: string; // Sinhala / Tamil
  botanicalName: string;
  seasons: ("maha" | "yala")[];
  seasonalityNotes: string;

  // Water need with explicit measurement basis
  waterNeed: WaterNeedSpec;

  // Maturity
  maturity: CropMaturitySpec;

  // Botanical & soil interactions
  nitrogenFixing: boolean;
  nitrogenFixingSource: string;

  waterloggingSensitivity: "high" | "moderate" | "low" | "tolerant";
  waterloggingSource: string;

  continuousCroppingRisk: boolean; // e.g., true for cowpea where continuous cropping causes disease buildup
  continuousCroppingSource: string;

  optimalTemperatureRangeC: [number, number] | null;
  temperatureSource: string;

  soilImpactSummary: string;
  soilImpactSource: string;

  // Dry Zone research context note
  researchStationContext: string;
}
