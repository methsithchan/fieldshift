import { CropDefinition } from "@/lib/types/crops";

/**
 * Crop catalog for Sri Lanka Dry and Intermediate Zones.
 *
 * CRITICAL METHODOLOGICAL NOTES:
 * 1. Water figures measure fundamentally DIFFERENT agronomic bases:
 *    - Rice measures 'total requirement' including puddling, percolation, and seepage.
 *    - Legumes measure 'crop water use' (consumptive ET).
 *    The rotation engine MUST NOT compare water need directly across different bases.
 * 2. Maize and Black Gram water needs are left null; confidence degrades gracefully.
 * 3. All agronomic figures are Dry Zone research station values (primarily Field Crops
 *    Research and Development Institute / Rice R&D Institute at Mahailluppallama),
 *    and do NOT represent plot-scale guarantees for Padaviya.
 */

export const CROPS: Record<string, CropDefinition> = {
  rice: {
    id: "rice",
    name: "Rice (Paddy)",
    localName: "වී (Paddy) / நெல்",
    botanicalName: "Oryza sativa",
    seasons: ["maha", "yala"],
    seasonalityNotes:
      "Grown in both Maha and Yala under tank irrigation or rainfed conditions. Maha provides highest natural rainfall; Yala frequently faces severe irrigation deficits in Dry Zone command areas.",

    waterNeed: {
      value: [948, 1232],
      basis: "total requirement",
      unit: "mm/season",
      soilContext:
        "Mahailluppallama experiments: 948–1,057 mm for 3-month crops and 1,128–1,232 mm for 4-month crops across Low Humic Gley (LHG) and imperfectly drained Reddish Brown Earth (RBE) soils.",
      source:
        "Sri Lanka Department of Agriculture (DOA) / Rice Research and Development Institute (RRDI) Mahailluppallama experimental trials. Supplementary irrigation requirement study indicates 597–1,000 mm in Maha vs 1,200–1,300 mm in Yala.",
      notes:
        "CRITICAL: Includes land soaking, puddling, standing water evaporation, and deep percolation losses. Not comparable to crop-only evapotranspiration figures of upland crops.",
    },

    maturity: {
      daysRange: [85, 135],
      varietyClasses:
        "Ultra-short (<90d, e.g. Bg 250), Short (90–99d, e.g. Bg 300, At 306), Medium (100–109d, e.g. Bg 352, Bw 367), Long (110–135d, e.g. Bg 403). Maturity is typically 1–6 days shorter in Maha than in Yala.",
      source: "Sri Lanka Department of Agriculture (DOA) varietal releases and crop calendar.",
      notes: "Farmers select short-duration varieties (3 months) for water-scarce Yala seasons.",
    },

    nitrogenFixing: false,
    nitrogenFixingSource: "General botanical knowledge (Poaceae family / non-legume).",

    waterloggingSensitivity: "tolerant",
    waterloggingSource: "General agronomic knowledge (adapted to flooded/anaerobic conditions via aerenchyma).",

    continuousCroppingRisk: false, // Traditional continuous wetland paddy exists, but increases pest build-up and groundwater methane
    continuousCroppingSource: "DOA agronomy guides; continuous mono-cropping increases brown planthopper and blast pressure.",

    optimalTemperatureRangeC: [25, 33],
    temperatureSource: "DOA Rice Agronomy Handbook.",

    soilImpactSummary:
      "Continuous flooded paddy can degrade soil structure over time and leach mobile nutrients; puddling creates a hard plow pan that limits subsequent upland root penetration.",
    soilImpactSource: "FAO / DOA Soil Science Division, Mahailluppallama.",

    researchStationContext:
      "Mahailluppallama Field Crops & Rice R&D Institutes. Dry Zone station benchmark.",
  },

  green_gram: {
    id: "green_gram",
    name: "Green Gram (Mung Bean)",
    localName: "මුං ඇට (Mung) / பாசிப்பயறு",
    botanicalName: "Vigna radiata",
    seasons: ["yala", "maha"],
    seasonalityNotes:
      "Widely cultivated in Yala on residual paddy moisture and in rainfed uplands during early/late rains. DOA actively promotes third-season cultivation immediately following Yala paddy.",

    waterNeed: {
      value: [228, 270],
      basis: "crop water use",
      unit: "mm/season",
      soilContext:
        "Dry Zone research station trials: ~228 mm in Maha and ~270 mm in Yala under well-drained Reddish Brown Earths.",
      source:
        "Sri Lanka Department of Agriculture (DOA) Field Crops Research and Development Institute, Mahailluppallama study on other field crops (OFCs).",
      notes:
        "Consumptive crop water requirement only. Well suited for low-water Yala cultivation and residual moisture cropping.",
    },

    maturity: {
      daysRange: [60, 65],
      varietyClasses: "Popular DOA varieties include MI-5, MI-6, and Harsha (~60–65 days).",
      source: "DOA NAICC Field Crop Guidelines.",
      notes: "Shortest duration among major Dry Zone grain legumes, fitting narrow seasonal windows.",
    },

    nitrogenFixing: true,
    nitrogenFixingSource:
      "General botanical knowledge (biological nitrogen fixation via Rhizobium root nodule symbiosis in Fabaceae).",

    waterloggingSensitivity: "high",
    waterloggingSource:
      "DOA crop management guides: highly susceptible to collar rot, yellowing, and root death under poorly drained or waterlogged soils.",

    continuousCroppingRisk: true,
    continuousCroppingSource:
      "DOA Plant Protection Division: repeated continuous legume planting encourages soil-borne fungal pathogens (Rhizoctonia, Fusarium).",

    optimalTemperatureRangeC: [25, 35],
    temperatureSource: "DOA Crop Recommendation Guides.",

    soilImpactSummary:
      "Fixes atmospheric nitrogen (reducing synthetic N fertilizer demand for the succeeding crop) and provides readily decomposable organic biomass that improves soil microbial activity.",
    soilImpactSource: "General agronomic & DOA Field Crops literature.",

    researchStationContext:
      "Field Crops Research and Development Institute (FCRDI), Mahailluppallama.",
  },

  cowpea: {
    id: "cowpea",
    name: "Cowpea",
    localName: "කවුපි (Kauwpi) / தட்டப்பயறு",
    botanicalName: "Vigna unguiculata",
    seasons: ["yala", "maha"],
    seasonalityNotes:
      "Drought-hardy legume suited for Yala in rice fallows and Maha upland cultivation. Ministry planned targets reflect balanced seasonal cultivation across both seasons.",

    waterNeed: {
      value: [175, 288],
      basis: "crop water use",
      unit: "mm/season",
      soilContext:
        "1992 Dry Zone post-paddy moisture thesis: estimated water requirement at 288 mm, with apparent consumption ~175 mm on residual soil moisture.",
      source:
        "Dry Zone post-paddy moisture utilization thesis (1992) / DOA Field Crops references. Flagged: historical point study requiring contemporary validation.",
      notes:
        "Consumptive crop water use. Marked as point study; actual requirement depends heavily on residual water table depth.",
    },

    maturity: {
      daysRange: [75, 90],
      varietyClasses: "Popular DOA varieties: Dhawala, Waruni, Bombay, Anandha (75–90 days).",
      source: "Sri Lanka Department of Agriculture (DOA) Crop Calendar.",
      notes: "Moderate duration allows flexibility in rice-based cropping systems.",
    },

    nitrogenFixing: true,
    nitrogenFixingSource:
      "General botanical knowledge (Rhizobium nitrogen fixation in Fabaceae).",

    waterloggingSensitivity: "high",
    waterloggingSource:
      "Sri Lanka DOA advisory: Cowpea is highly sensitive to waterlogging and poor drainage. Unsuitable for heavy, poorly drained Low Humic Gley soils without raised beds.",

    continuousCroppingRisk: true,
    continuousCroppingSource:
      "Sri Lanka DOA official agronomic guideline: Cowpea should NOT be grown continuously on the same field to prevent rapid build-up of soil-borne wilt and root diseases.",

    optimalTemperatureRangeC: [20, 30],
    temperatureSource: "Sri Lanka Department of Agriculture (DOA) crop factsheet.",

    soilImpactSummary:
      "Substantial nitrogen fixation and extensive ground cover that inhibits weed seed germination and reduces soil surface erosion during dry spells.",
    soilImpactSource: "DOA Field Crops research.",

    researchStationContext:
      "Mahailluppallama Field Crops Research Station benchmark.",
  },

  black_gram: {
    id: "black_gram",
    name: "Black Gram (Urad)",
    localName: "උළුඳු (Ulundu) / உளுந்து",
    botanicalName: "Vigna mungo",
    seasons: ["maha", "yala"],
    seasonalityNotes:
      "Approximately 80% is grown in Maha as a rainfed upland crop; roughly 20% in Yala in paddy fields with supplementary irrigation. National cultivation target: 17,225 ha (Maha) vs 3,812 ha (Yala).",

    waterNeed: {
      value: null, // UNVERIFIED / UNMEASURED in reviewed DOA documentation
      basis: "unverified",
      unit: "mm/season",
      source:
        "UNVERIFIED - No verified millimeter water requirement figure located in primary DOA publications. Existing citations trace to secondary web summaries.",
      notes:
        "Intentionally left null so rotation engine does not fabricate water consumption. Lowers scenario confidence rating transparently.",
    },

    maturity: {
      daysRange: [80, 90],
      varietyClasses: "Standard DOA variety: MI-1 (80–90 days).",
      source: "Sri Lanka Department of Agriculture (DOA) FCRDI variety guide (MI-1).",
      notes: "Well-established variety in the Northern and North Central Dry Zones.",
    },

    nitrogenFixing: true,
    nitrogenFixingSource:
      "General botanical knowledge (Rhizobium symbiotic nitrogen fixation in Fabaceae).",

    waterloggingSensitivity: "moderate",
    waterloggingSource:
      "DOA Field Crops handbook: sensitive to standing water, but slightly more tolerant of heavy soils than green gram if surface drainage is provided.",

    continuousCroppingRisk: true,
    continuousCroppingSource:
      "DOA Plant Pathology guidelines: susceptible to fungal root rot under consecutive legume plantings.",

    optimalTemperatureRangeC: [25, 35],
    temperatureSource: "DOA variety guide for MI-1.",

    soilImpactSummary:
      "Enhances soil nitrogen balance, adds organic residue, and leaves beneficial residual nitrogen for a succeeding cereal crop.",
    soilImpactSource: "DOA Agronomy summaries.",

    researchStationContext:
      "Mahailluppallama and Regional Agricultural Research Station, Kilinochchi.",
  },

  maize: {
    id: "maize",
    name: "Maize (Corn)",
    localName: "බඩඉරිඟු (Bada Iringu) / மக்காச்சோளம்",
    botanicalName: "Zea mays",
    seasons: ["maha", "yala"],
    seasonalityNotes:
      "Predominantly cultivated in Maha as a rainfed upland commercial crop. National seasonal targets reflect intense rainfed focus: ~105,307 ha in Maha vs ~17,757 ha in Yala.",

    waterNeed: {
      value: null, // UNVERIFIED in reviewed DOA experimental papers for Dry Zone
      basis: "unverified",
      unit: "mm/season",
      source:
        "UNVERIFIED - Specific millimeter water requirement for Sri Lanka Dry Zone hybrids was not found in reviewed DOA research papers.",
      notes:
        "Intentionally left null. FAO general global literature suggests 500–800 mm, but local Sri Lankan research trial number is unverified; engine penalizes confidence rather than substituting guesses.",
    },

    maturity: {
      daysRange: [105, 110],
      varietyClasses: "DOA lines and commercial hybrids tested at Mahailluppallama: ~105–110 days.",
      source:
        "Sri Lanka Department of Agriculture (DOA) research paper on maize lines and hybrids at Mahailluppallama.",
      notes:
        "Maturity is specific to reported research lines; open-pollinated traditional varieties may vary.",
    },

    nitrogenFixing: false,
    nitrogenFixingSource: "General botanical knowledge (Poaceae family / cereal crop).",

    waterloggingSensitivity: "high",
    waterloggingSource:
      "DOA Maize agronomy guide: highly vulnerable to waterlogging and soil anaerobic conditions, especially during seedling and flowering stages.",

    continuousCroppingRisk: true,
    continuousCroppingSource:
      "DOA crop protection: continuous maize risks severe Fall Armyworm (Spodoptera frugiperda) and stalk borer carryover, plus heavy soil nutrient depletion.",

    optimalTemperatureRangeC: [21, 32],
    temperatureSource: "DOA Agro-technology factsheet.",

    soilImpactSummary:
      "High biomass producer but a heavy nutrient feeder (especially Nitrogen and Potassium). Without organic return or crop rotation with legumes, continuous maize depletes soil fertility.",
    soilImpactSource: "DOA / FAO Soil Fertility Management guides.",

    researchStationContext:
      "Field Crops Research and Development Institute (FCRDI), Mahailluppallama.",
  },
};

export const CROP_LIST: CropDefinition[] = Object.values(CROPS);
