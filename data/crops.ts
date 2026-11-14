import { CropDefinition } from "@/lib/types/crops";

/**
 * Crop catalog for Sri Lanka Dry and Intermediate Zones.
 *
 * RIGOROUS SOURCING RULES:
 * Only permitted research citations:
 *  - Rice water requirement: DOA / RRDI Mahailluppallama (948–1,232 mm)
 *  - Green gram water requirement: Annals of the Sri Lanka Department of Agriculture (2014) (228 mm Maha, 270 mm Yala)
 *  - Cowpea water requirement: Liyanage (1992) (175–288 mm)
 *  - Cowpea temperature (20–30°C), duration (75–90 d), waterlogging sensitivity, no continuous cowpea: DOA RARDC Kilinochchi
 *  - Black gram MI-1 duration (80–90 d), temperature (25–35°C): Secondary copy of Sri Lanka DOA text - unverified primary source
 *  - Maize duration (105–110 d): Karunaratne (2006)
 *  - Rice maturity classes: Illangakoon et al. (Bg 352 is ~96 days short)
 *  - Ministry of Agriculture 2024/25 seasonal area targets
 *  - Legume nitrogen fixation: general knowledge - not sourced
 *  - Waterlogging and continuous cropping: "unverified" unless explicitly sourced above.
 */

export const CROPS: Record<string, CropDefinition> = {
  rice: {
    id: "rice",
    name: "Rice (Paddy)",
    localName: "වී (Paddy) / நெல்",
    botanicalName: "Oryza sativa",
    seasons: ["maha", "yala"],
    seasonalityNotes:
      "Cultivated in both Maha and Yala seasons under irrigation or rainfed lowland conditions.",
    seasonalitySource: "general knowledge - not sourced",

    waterNeed: {
      value: [948, 1232],
      basis: "total requirement",
      unit: "mm/season",
      soilContext:
        "Mahailluppallama trials: 948–1,057 mm for 3-month crops and 1,128–1,232 mm for 4-month crops across soil types.",
      source: "DOA / RRDI Mahailluppallama",
      notes:
        "Total requirement includes land preparation (soaking/puddling), standing water maintenance, and seepage/percolation. Not comparable to crop water use of upland crops.",
    },

    maturity: {
      daysRange: [85, 135],
      varietyClasses:
        "Maturity classes (Illangakoon et al.): ultra-short (<90 days, e.g. Bg 250), short (90–99 days, e.g. Bg 300, Bg 352 ~96d), medium (100–109 days), long (110–135 days).",
      source: "Illangakoon et al.",
      notes: "Maturity duration is reported 1–6 days shorter in Maha than in Yala.",
    },

    nitrogenFixing: false,
    nitrogenFixingSource: "general knowledge - not sourced",

    waterloggingSensitivity: "tolerant",
    waterloggingSource: "general knowledge - not sourced",

    continuousCroppingRisk: "unverified",
    continuousCroppingSource: "unverified",

    optimalTemperatureRangeC: null,
    temperatureSource: "unverified",

    soilImpactSummary:
      "Flooded paddy puddling forms a dense plow pan; standing water leaches soluble nutrients.",
    soilImpactSource: "general knowledge - not sourced",

    researchStationContext: "DOA / RRDI Mahailluppallama research station trials.",
  },

  green_gram: {
    id: "green_gram",
    name: "Green Gram (Mung Bean)",
    localName: "මුං ඇට (Mung) / பாசிப்பயறு",
    botanicalName: "Vigna radiata",
    seasons: ["yala", "maha"],
    seasonalityNotes:
      "Cultivated in Yala and Maha. Promoted for short-window cultivation following paddy.",
    seasonalitySource: "Ministry of Agriculture Sri Lanka 2024/25 seasonal targets",

    waterNeed: {
      value: [228, 270],
      basis: "crop water use",
      unit: "mm/season",
      soilContext: "Maha: ~228 mm; Yala: ~270 mm.",
      source: "Annals of the Sri Lanka Department of Agriculture (2014)",
      notes: "Crop water use (consumptive evapotranspiration) only.",
    },

    maturity: {
      daysRange: [60, 65],
      varietyClasses: "Reported growth stages total ~65 days.",
      source: "Annals of the Sri Lanka Department of Agriculture (2014)",
      notes: undefined,
    },

    nitrogenFixing: true,
    nitrogenFixingSource: "general knowledge - not sourced",

    waterloggingSensitivity: "unverified",
    waterloggingSource: "unverified",

    continuousCroppingRisk: "unverified",
    continuousCroppingSource: "unverified",

    optimalTemperatureRangeC: null,
    temperatureSource: "unverified",

    soilImpactSummary: "Legume residue adds organic nitrogen to soil through biological fixation.",
    soilImpactSource: "general knowledge - not sourced",

    researchStationContext: "Sri Lanka Department of Agriculture Dry Zone trials.",
  },

  cowpea: {
    id: "cowpea",
    name: "Cowpea",
    localName: "කවුපි (Kauwpi) / தட்டப்பயறு",
    botanicalName: "Vigna unguiculata",
    seasons: ["yala", "maha"],
    seasonalityNotes: "Cultivated in both Yala and Maha seasons.",
    seasonalitySource: "Ministry of Agriculture Sri Lanka 2024/25 seasonal targets",

    waterNeed: {
      value: [175, 288],
      basis: "crop water use",
      unit: "mm/season",
      soilContext:
        "Estimated water requirement 288 mm, with apparent consumption 175 mm on residual soil moisture after paddy.",
      source: "Liyanage (1992)",
      notes: "Point thesis study on post-paddy residual moisture in the Dry Zone.",
    },

    maturity: {
      daysRange: [75, 90],
      varietyClasses: "Harvest 75–90 days after planting.",
      source: "DOA RARDC Kilinochchi",
      notes: undefined,
    },

    nitrogenFixing: true,
    nitrogenFixingSource: "general knowledge - not sourced",

    waterloggingSensitivity: "high",
    waterloggingSource: "DOA RARDC Kilinochchi (highly sensitive to waterlogging)",

    continuousCroppingRisk: true,
    continuousCroppingSource:
      "DOA RARDC Kilinochchi (should not be grown continuously on the same field)",

    optimalTemperatureRangeC: [20, 30],
    temperatureSource: "DOA RARDC Kilinochchi",

    soilImpactSummary:
      "Fixes atmospheric nitrogen; sensitive to excess moisture in heavy soil.",
    soilImpactSource: "DOA RARDC Kilinochchi",

    researchStationContext: "Dry Zone research records (Kilinochchi / Mahailluppallama).",
  },

  black_gram: {
    id: "black_gram",
    name: "Black Gram (Urad)",
    localName: "උළුඳු (Ulundu) / உளுந்து",
    botanicalName: "Vigna mungo",
    seasons: ["maha", "yala"],
    seasonalityNotes:
      "Ministry targets show 17,225 ha in Maha vs 3,812 ha in Yala (heavily rainfed Maha pattern). About 80% grown in Maha as rainfed upland, remainder in Yala with supplementary irrigation.",
    seasonalitySource: "Ministry of Agriculture Sri Lanka 2024/25 seasonal targets",

    waterNeed: {
      value: null,
      basis: "unverified",
      unit: "mm/season",
      source: "UNVERIFIED - no verified figure found in reviewed primary DOA publications",
      notes: "Water requirement in mm is unverified; engine records a data gap.",
    },

    maturity: {
      daysRange: [80, 90],
      varietyClasses: "Variety MI-1 matures in 80–90 days.",
      source: "Secondary copy of Sri Lanka DOA text - unverified primary source",
      notes: undefined,
    },

    nitrogenFixing: true,
    nitrogenFixingSource: "general knowledge - not sourced",

    waterloggingSensitivity: "unverified",
    waterloggingSource: "unverified",

    continuousCroppingRisk: "unverified",
    continuousCroppingSource: "unverified",

    optimalTemperatureRangeC: [25, 35],
    temperatureSource: "Secondary copy of Sri Lanka DOA text - unverified primary source",

    soilImpactSummary: "Legume root nodulation adds nitrogen to soil.",
    soilImpactSource: "general knowledge - not sourced",

    researchStationContext: "Dry Zone research records.",
  },

  maize: {
    id: "maize",
    name: "Maize (Corn)",
    localName: "බඩඉරිඟු (Bada Iringu) / மக்காச்சோளம்",
    botanicalName: "Zea mays",
    seasons: ["maha", "yala"],
    seasonalityNotes:
      "Ministry targets show ~105,307 ha in Maha vs ~17,757 ha in Yala (predominantly rainfed Maha crop).",
    seasonalitySource: "Ministry of Agriculture Sri Lanka 2024/25 seasonal targets",

    waterNeed: {
      value: null,
      basis: "unverified",
      unit: "mm/season",
      source: "UNVERIFIED - no verified mm figure in reviewed research papers for Sri Lanka Dry Zone",
      notes: "Water requirement in mm is unverified; engine records a data gap.",
    },

    maturity: {
      daysRange: [105, 110],
      varietyClasses: "Tested lines and hybrids at Mahailluppallama mature in 105–110 days.",
      source: "Karunaratne (2006)",
      notes: "Specific to research lines at Mahailluppallama.",
    },

    nitrogenFixing: false,
    nitrogenFixingSource: "general knowledge - not sourced",

    waterloggingSensitivity: "unverified",
    waterloggingSource: "unverified",

    continuousCroppingRisk: "unverified",
    continuousCroppingSource: "unverified",

    optimalTemperatureRangeC: null,
    temperatureSource: "unverified",

    soilImpactSummary: "Cereal biomass producer; non-nitrogen-fixing.",
    soilImpactSource: "general knowledge - not sourced",

    researchStationContext: "Mahailluppallama research station trials (Karunaratne 2006).",
  },
};

export const CROP_LIST: CropDefinition[] = Object.values(CROPS);
