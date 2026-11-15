import { RotationScenarioInput } from "@/lib/types/engine";
import { CROPS } from "@/data/crops";

/**
 * Builds 3 scenarios for the farmer wizard:
 * 1. Strategy A: Farmer's current rotation (Maha -> Yala -> Maha).
 * 2. Strategy B: Legume Integration rotation built from user's considered crops where possible,
 *    falling back to the fixed Strategy B (Rice -> Green Gram -> Rice).
 * 3. Strategy C: Diversified Resilient rotation built from user's considered crops where possible,
 *    falling back to the fixed Strategy C (Rice -> Cowpea -> Maize).
 */
export function buildFarmerScenarios(
  currentMahaCrop: string,
  currentYalaCrop: string,
  consideredCrops: string[]
): [RotationScenarioInput, RotationScenarioInput, RotationScenarioInput] {
  // Validate current crops exist in CROPS catalog; fallback safely
  const maha1 = CROPS[currentMahaCrop] ? currentMahaCrop : "rice";
  const yala1 = CROPS[currentYalaCrop] ? currentYalaCrop : "rice";

  // Strategy A: Baseline rotation
  const scenarioA: RotationScenarioInput = {
    id: "A",
    title: "Strategy A: Your Current Rotation",
    tagline: "Your farm baseline rotation across 3 consecutive seasons",
    isExistingRotation: true,
    steps: [
      { seasonId: "maha", seasonName: "Maha (Year 1)", cropId: maha1 },
      { seasonId: "yala", seasonName: "Yala (Year 1)", cropId: yala1 },
      { seasonId: "maha", seasonName: "Maha (Year 2)", cropId: maha1 },
    ],
  };

  // Legumes defined in data/crops.ts
  const legumeIds = ["green_gram", "cowpea", "black_gram"];
  const selectedLegumes = consideredCrops.filter((id) => legumeIds.includes(id));
  const nonLegumes = consideredCrops.filter((id) => !legumeIds.includes(id));

  // Strategy B: Legume Integration
  // Use user's considered legume if available; otherwise fallback to fixed B (rice -> green_gram -> rice)
  let bStep1 = "rice";
  let bStep2 = "green_gram";
  let bStep3 = "rice";
  let bTagline = "Rice in Maha rotated with short-duration Green Gram in Yala";

  if (selectedLegumes.length > 0) {
    const chosenLegume = selectedLegumes[0];
    const legumeName = CROPS[chosenLegume]?.name || chosenLegume;
    bStep1 = maha1;
    bStep2 = chosenLegume;
    bStep3 = maha1;
    bTagline = `${CROPS[maha1]?.name || "Rice"} in Maha rotated with ${legumeName} in Yala`;
  }

  const scenarioB: RotationScenarioInput = {
    id: "B",
    title: "Strategy B: Legume Integration",
    tagline: bTagline,
    isExistingRotation: false,
    steps: [
      { seasonId: "maha", seasonName: "Maha (Year 1)", cropId: bStep1 },
      { seasonId: "yala", seasonName: "Yala (Year 1)", cropId: bStep2 },
      { seasonId: "maha", seasonName: "Maha (Year 2)", cropId: bStep3 },
    ],
  };

  // Strategy C: Diversified Multi-Crop Rotation
  // Fixed fallback is: Rice -> Cowpea -> Maize
  let cStep1 = "rice";
  let cStep2 = "cowpea";
  let cStep3 = "maize";
  let cTagline = "Rice in Maha, Cowpea in Yala, and rainfed Maize in Maha";

  if (consideredCrops.length >= 2) {
    // Pick two distinct crops from considered
    const c2 = consideredCrops[0];
    const c3 = consideredCrops[1];
    cStep1 = maha1;
    cStep2 = c2;
    cStep3 = c3;
    cTagline = `Diversified rotation with ${CROPS[c2]?.name || c2} and ${CROPS[c3]?.name || c3}`;
  } else if (consideredCrops.length === 1) {
    const single = consideredCrops[0];
    cStep1 = maha1;
    if (legumeIds.includes(single)) {
      cStep2 = single;
      cStep3 = "maize"; // Add maize for diversification
      cTagline = `${CROPS[maha1]?.name || "Rice"} rotated with ${CROPS[single]?.name || single} and Maize`;
    } else {
      cStep2 = "cowpea";
      cStep3 = single;
      cTagline = `${CROPS[maha1]?.name || "Rice"} rotated with Cowpea and ${CROPS[single]?.name || single}`;
    }
  }

  const scenarioC: RotationScenarioInput = {
    id: "C",
    title: "Strategy C: Diversified Resilient Rotation",
    tagline: cTagline,
    isExistingRotation: false,
    steps: [
      { seasonId: "maha", seasonName: "Maha (Year 1)", cropId: cStep1 },
      { seasonId: "yala", seasonName: "Yala (Year 1)", cropId: cStep2 },
      { seasonId: "maha", seasonName: "Maha (Year 2)", cropId: cStep3 },
    ],
  };

  return [scenarioA, scenarioB, scenarioC];
}
