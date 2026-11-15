import { describe, it, expect } from "vitest";
import { buildFarmerScenarios } from "@/lib/engine/farmer-strategies";
import { evaluateAllScenarios } from "@/lib/engine/rotation";
import { SoilFormState, PriorityWeights } from "@/lib/types/engine";

describe("Farmer Strategies Builder & Three-Card Data", () => {
  const defaultSoil: SoilFormState = {
    ph: null,
    phConfidence: "unknown",
    texture: "unknown",
    textureConfidence: "unknown",
    organicCarbon: "unknown",
    organicCarbonConfidence: "unknown",
    drainage: "unknown",
    drainageConfidence: "unknown",
  };

  const defaultWeights: PriorityWeights = {
    rainfallCoverage: 50,
    soilHealth: 50,
    economicPotential: 0,
  };

  it("builds Strategy A using the farmer's current Maha and Yala crops", () => {
    const [scenA] = buildFarmerScenarios("rice", "cowpea", []);
    expect(scenA.steps[0].cropId).toBe("rice");
    expect(scenA.steps[1].cropId).toBe("cowpea");
    expect(scenA.steps[2].cropId).toBe("rice");
  });

  it("handles the one-crop assumption where Strategy A uses the same crop in both seasons", () => {
    // When only one crop is chosen (e.g. Rice in Maha and Rice in Yala)
    const [scenA, scenB, scenC] = buildFarmerScenarios("rice", "rice", []);
    expect(scenA.steps[0].cropId).toBe("rice");
    expect(scenA.steps[1].cropId).toBe("rice");
    expect(scenA.steps[2].cropId).toBe("rice");

    // Single crop check used by UI
    const isSingleCrop = scenA.steps[0].cropId === scenA.steps[1].cropId;
    expect(isSingleCrop).toBe(true);

    // Strategy B and C still offer diversification
    expect(scenB.steps[1].cropId).toBe("green_gram");
    expect(scenC.steps[1].cropId).toBe("cowpea");
  });

  it("renders valid three-card evaluation data for Strategy A, B, and C without null climate crash", () => {
    const scenarios = buildFarmerScenarios("maize", "maize", []);
    const evaluations = evaluateAllScenarios(scenarios, null, defaultSoil, defaultWeights);

    expect(evaluations.length).toBe(3);
    const [evalA, evalB, evalC] = evaluations;

    // Strategy A (Maize monoculture baseline)
    expect(evalA.id).toBe("A");
    expect(evalA.steps.length).toBe(3);
    // Maize has unverified water requirement -> surfaces in data gaps
    expect(evalA.dataGaps.length).toBeGreaterThan(0);
    // Monoculture penalty is triggered
    expect(evalA.risks.length).toBeGreaterThan(0);

    // Strategy B (Legume integration)
    expect(evalB.id).toBe("B");
    expect(evalB.steps[1].crop.id).toBe("green_gram");

    // Strategy C (Diversified rotation)
    expect(evalC.id).toBe("C");
    expect(evalC.steps.map((s) => s.crop.id)).toEqual(["rice", "cowpea", "maize"]);
  });

  it("falls back to fixed Strategy B and C when no considered crops are selected", () => {
    const [scenA, scenB, scenC] = buildFarmerScenarios("rice", "rice", []);
    // Fixed B: Rice -> Green Gram -> Rice
    expect(scenB.steps[0].cropId).toBe("rice");
    expect(scenB.steps[1].cropId).toBe("green_gram");
    expect(scenB.steps[2].cropId).toBe("rice");

    // Fixed C: Rice -> Cowpea -> Maize
    expect(scenC.steps[0].cropId).toBe("rice");
    expect(scenC.steps[1].cropId).toBe("cowpea");
    expect(scenC.steps[2].cropId).toBe("maize");
  });

  it("integrates user-considered legume into Strategy B", () => {
    const [, scenB] = buildFarmerScenarios("rice", "rice", ["black_gram"]);
    expect(scenB.steps[1].cropId).toBe("black_gram");
  });

  it("builds diversified Strategy C when 2 considered crops are provided", () => {
    const [, , scenC] = buildFarmerScenarios("rice", "rice", ["green_gram", "maize"]);
    expect(scenC.steps[0].cropId).toBe("rice");
    expect(scenC.steps[1].cropId).toBe("green_gram");
    expect(scenC.steps[2].cropId).toBe("maize");
  });
});
