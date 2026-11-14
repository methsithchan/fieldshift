export interface SeasonConfig {
  id: "maha" | "yala";
  name: string;
  localName: string;
  // Month numbers (1-12) defining the cultivation season
  months: number[];
  startMonthName: string;
  endMonthName: string;
  description: string;
  source: string;
  verified: boolean;
  notes: string;
}

export interface CultivationCalendar {
  seasons: SeasonConfig[];
  notes: string;
}

/**
 * Cultivation seasons in Sri Lanka based on FAO Sri Lanka Crop Calendar
 * and Sri Lanka Department of Agriculture (DOA) seasonal advisories.
 */
export const CULTIVATION_SEASONS: SeasonConfig[] = [
  {
    id: "maha",
    name: "Maha Season",
    localName: "මහ කන්නය / பெரும் போகம்",
    // October to March as defined by FAO Sri Lanka Crop Calendar
    months: [10, 11, 12, 1, 2, 3],
    startMonthName: "October",
    endMonthName: "March",
    description: "Major cultivation season aligned with the Northeast monsoon rains across the Dry and Intermediate Zones.",
    source: "FAO Sri Lanka Crop Calendar (Maha: Oct–Mar); Sri Lanka Department of Agriculture (DOA) seasonal planting guidelines (advising sowing mid-to-late October in Dry Zone).",
    verified: true,
    notes: "Primary rice cultivation period with highest natural rainfall and tank storage replenishment.",
  },
  {
    id: "yala",
    name: "Yala Season",
    localName: "යල කන්නය / சிறு போகம்",
    // April to September as defined by FAO Sri Lanka Crop Calendar
    months: [4, 5, 6, 7, 8, 9],
    startMonthName: "April",
    endMonthName: "September",
    description: "Minor cultivation season aligned with the Southwest monsoon; characterized by significantly lower rainfall and higher evaporative demand in the Dry Zone.",
    source: "FAO Sri Lanka Crop Calendar (Yala: Apr–Sep); Sri Lanka Department of Agriculture (DOA) crop advisories.",
    verified: true,
    notes: "High water stress season in Dry Zone; requires stringent water budgeting, crop diversification into other field crops (OFCs), or short-duration legumes.",
  },
];
