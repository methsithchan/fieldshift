import { describe, it, expect } from "vitest";
import { buildFarmerScenarios } from "@/lib/engine/farmer-strategies";

describe("Farmer Strategies Builder", () => {
  it("builds Strategy A using the farmer's current Maha and Yala crops", () => {
    const [scenA] = buildFarmerScenarios("rice", "cowpea", []);
    expect(scenA.steps[0].cropId).toBe("rice");
    expect(scenA.steps[1].cropId).toBe("cowpea");
    expect(scenA.steps[2].cropId).toBe("rice");
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
