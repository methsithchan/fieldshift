import { describe, it, expect } from "vitest";
import { getSoilFormUpdate } from "../components/SoilForm";
import { SoilFormState } from "../lib/types/engine";

describe("SoilForm — Atomic State Updates & Unknown Resets", () => {
  it("clearing pH sets { ph: null, phConfidence: 'unknown' } in one update", () => {
    const patchNull = getSoilFormUpdate("ph", "value", null);
    expect(patchNull).toEqual({ ph: null, phConfidence: "unknown" });

    const patchEmpty = getSoilFormUpdate("ph", "value", "");
    expect(patchEmpty).toEqual({ ph: null, phConfidence: "unknown" });
  });

  it("selecting Unknown on pH source button resets both value and source", () => {
    const patch = getSoilFormUpdate("ph", "source", "unknown");
    expect(patch).toEqual({ ph: null, phConfidence: "unknown" });
  });

  it("entering a pH number updates only pH without defaulting confidence", () => {
    const patch = getSoilFormUpdate("ph", "value", 6.8);
    expect(patch).toEqual({ ph: 6.8 });
    expect(patch).not.toHaveProperty("phConfidence");
  });

  it("selecting Unknown on texture dropdown resets both texture and textureConfidence", () => {
    const patch = getSoilFormUpdate("texture", "value", "unknown");
    expect(patch).toEqual({ texture: "unknown", textureConfidence: "unknown" });
  });

  it("selecting Unknown on texture source button resets both texture and textureConfidence", () => {
    const patch = getSoilFormUpdate("texture", "source", "unknown");
    expect(patch).toEqual({ texture: "unknown", textureConfidence: "unknown" });
  });

  it("selecting a valid texture updates texture without defaulting confidence to estimated", () => {
    const patch = getSoilFormUpdate("texture", "value", "loam");
    expect(patch).toEqual({ texture: "loam" });
    expect(patch).not.toHaveProperty("textureConfidence");
  });

  it("selecting Unknown on organic carbon dropdown resets both value and confidence", () => {
    const patch = getSoilFormUpdate("organicCarbon", "value", "unknown");
    expect(patch).toEqual({
      organicCarbon: "unknown",
      organicCarbonConfidence: "unknown",
    });
  });

  it("selecting Unknown on organic carbon source button resets both value and confidence", () => {
    const patch = getSoilFormUpdate("organicCarbon", "source", "unknown");
    expect(patch).toEqual({
      organicCarbon: "unknown",
      organicCarbonConfidence: "unknown",
    });
  });

  it("selecting Unknown on drainage dropdown resets both value and confidence", () => {
    const patch = getSoilFormUpdate("drainage", "value", "unknown");
    expect(patch).toEqual({
      drainage: "unknown",
      drainageConfidence: "unknown",
    });
  });

  it("selecting Unknown on drainage source button resets both value and confidence", () => {
    const patch = getSoilFormUpdate("drainage", "source", "unknown");
    expect(patch).toEqual({
      drainage: "unknown",
      drainageConfidence: "unknown",
    });
  });

  it("proves selecting Unknown after choosing a value resets both in one atomic call", () => {
    // Initial populated state
    const currentState: SoilFormState = {
      ph: 6.5,
      phConfidence: "measured",
      texture: "loam",
      textureConfidence: "measured",
      organicCarbon: "medium",
      organicCarbonConfidence: "estimated",
      drainage: "well_drained",
      drainageConfidence: "measured",
    };

    // User selects "unknown" on texture dropdown
    const textureResetPatch = getSoilFormUpdate("texture", "value", "unknown");
    const updatedState1: SoilFormState = { ...currentState, ...textureResetPatch };

    expect(updatedState1.texture).toBe("unknown");
    expect(updatedState1.textureConfidence).toBe("unknown");

    // User selects "unknown" on drainage source button
    const drainageResetPatch = getSoilFormUpdate("drainage", "source", "unknown");
    const updatedState2: SoilFormState = { ...updatedState1, ...drainageResetPatch };

    expect(updatedState2.drainage).toBe("unknown");
    expect(updatedState2.drainageConfidence).toBe("unknown");

    // User clears pH
    const phResetPatch = getSoilFormUpdate("ph", "value", "");
    const updatedState3: SoilFormState = { ...updatedState2, ...phResetPatch };

    expect(updatedState3.ph).toBeNull();
    expect(updatedState3.phConfidence).toBe("unknown");
  });
});
