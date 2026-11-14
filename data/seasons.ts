export interface SeasonConfig {
  id: "maha" | "yala";
  name: string;
  localName: string;
  // Month numbers (1-12) defining the cultivation season
  months: number[];
  description: string;
  source: string;
  verified: boolean;
}

export interface CultivationCalendar {
  seasons: SeasonConfig[];
  notes: string;
}

/**
 * Cultivation seasons in Sri Lanka.
 * IMPORTANT: Month ranges here are marked UNVERIFIED pending confirmation
 * against the official Sri Lanka Department of Agriculture (DOA) crop calendar.
 */
export const CULTIVATION_SEASONS: SeasonConfig[] = [
  {
    id: "maha",
    name: "Maha Season",
    localName: "මහ කන්නය / பெரும் போகம்",
    // Standard dry zone operational window: October through February
    months: [10, 11, 12, 1, 2],
    description: "Major cultivation season aligned with the Northeast monsoon rains in the Dry Zone.",
    source: "UNVERIFIED - to be confirmed from Sri Lanka Department of Agriculture (DOA) Crop Calendar",
    verified: false,
  },
  {
    id: "yala",
    name: "Yala Season",
    localName: "යල කන්නය / சிறு போகம்",
    // Standard dry zone operational window: April through August
    months: [4, 5, 6, 7, 8],
    description: "Minor cultivation season aligned with the Southwest monsoon rains; lower precipitation in the Dry Zone.",
    source: "UNVERIFIED - to be confirmed from Sri Lanka Department of Agriculture (DOA) Crop Calendar",
    verified: false,
  },
];
