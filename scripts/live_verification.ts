import { describe, it } from "vitest";
import { evaluateScenario, getDefaultScenarios } from "../lib/engine/rotation";
import { SoilFormState, PriorityWeights } from "../lib/types/engine";
import { ProcessedClimateData } from "../lib/types/nasa";

describe("Live Verification Runner", () => {
  it("prints full step-by-step tables for Padaviya and Mahailluppallama", async () => {
    const padaviyaUrl = "http://localhost:3000/api/nasa-power?lat=8.83&lon=80.76";
    const mahaUrl = "http://localhost:3000/api/nasa-power?lat=8.11&lon=80.46";

    const pData: ProcessedClimateData = await (await fetch(padaviyaUrl)).json();
    const mData: ProcessedClimateData = await (await fetch(mahaUrl)).json();

    const soil: SoilFormState = {
      ph: 6.5,
      phConfidence: "measured",
      texture: "loam",
      textureConfidence: "measured",
      organicCarbon: "medium",
      organicCarbonConfidence: "measured",
      drainage: "well_drained",
      drainageConfidence: "measured",
    };

    const weights: PriorityWeights = {
      rainfallCoverage: 50,
      soilHealth: 50,
      economicPotential: 0,
    };

    const scenarios = getDefaultScenarios(["rice", "rice", "rice"]);

    function printReport(locationName: string, climate: ProcessedClimateData) {
      console.log(`\n========================================================================`);
      console.log(`LOCATION: ${locationName} (${climate.coordinates.latitude}°N, ${climate.coordinates.longitude}°E)`);
      console.log(`Seasonal Totals: Maha=${climate.seasonalSummary.mahaRainfallMm} mm (Oct-Mar), Yala=${climate.seasonalSummary.yalaRainfallMm} mm (Apr-Sep)`);
      console.log(`========================================================================`);

      scenarios.forEach((scen) => {
        const result = evaluateScenario(scen, climate, soil, weights);
        console.log(`\n--- SCENARIO ${result.id}: ${result.title} ---`);
        console.log(`Overall Composite: ${result.scores.compositeScore} | Soil Health: ${result.scores.soilHealth}`);
        console.log(
          `Rainfall Coverage: ${result.scores.rainfallCoverage} (Status: ${result.scores.rainfallCoverageStatus}, Assessed: ${result.scores.rainfallCoverageAssessedCount}/3)`
        );

        console.log(`Steps Breakdown:`);
        result.steps.forEach((st, idx) => {
          console.log(
            `  Step ${idx + 1} [${st.seasonName}] ${st.crop.name}:` +
            ` Window=${st.windowMonthsCount} mos |` +
            ` WindowRainfall=${st.windowRainfallMm} mm |` +
            ` Requirement=${st.cropWaterNeedMidpointMm !== null ? st.cropWaterNeedMidpointMm + ' mm' : 'NULL'} |` +
            ` Coverage=${st.waterCoverageRatio !== null ? st.waterCoverageRatio : 'NOT ASSESSED'}`
          );
        });

        console.log(`Engine Reasons:`);
        result.reasons.forEach((r) => console.log(`   * ${r}`));
      });
    }

    printReport("PADAVIYA", pData);
    printReport("MAHAILLUPPALLAMA", mData);
  });
});
