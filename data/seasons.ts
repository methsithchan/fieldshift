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
 * Cultivation seasons in Sri Lanka based on FAO Sri Lanka Crop Calendar.
 */
export const CULTIVATION_SEASONS: SeasonConfig[] = [
  {
    id: "maha",
    name: "Maha Season",
    localName: "මහ කන්නය / பெரும் போகம்",
    months: [10, 11, 12, 1, 2, 3],
    startMonthName: "October",
    endMonthName: "March",
    description: "Major cultivation season aligned with the Northeast monsoon rains in the Dry Zone.",
    source: "FAO Sri Lanka Crop Calendar (Maha: Oct–Mar, Yala: Apr–Sep)",
    verified: false,
    notes: "Primary cultivation season with highest rainfall and tank storage replenishment.",
  },
  {
    id: "yala",
    name: "Yala Season",
    localName: "යල කන්නය / சிறு போகம்",
    months: [4, 5, 6, 7, 8, 9],
    startMonthName: "April",
    endMonthName: "September",
    description: "Minor cultivation season with significantly lower rainfall and higher evaporative demand in the Dry Zone.",
    source: "FAO Sri Lanka Crop Calendar (Maha: Oct–Mar, Yala: Apr–Sep)",
    verified: false,
    notes: "Lower rainfall season; requires water budgeting or short-duration crops.",
  },
];
