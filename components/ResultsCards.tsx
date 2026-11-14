"use client";

import { ScenarioEvaluation } from "@/lib/types/engine";

interface ResultsCardsProps {
  evaluations: [ScenarioEvaluation, ScenarioEvaluation, ScenarioEvaluation];
}

const CONFIDENCE_STYLES = {
  high: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  moderate: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  low: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
};

export default function ResultsCards({ evaluations }: ResultsCardsProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">5. Rotation Strategy Comparison</h2>
          <p className="text-xs text-gray-500">
            Comparing your existing rotation against legume integration and diversified strategies.
          </p>
        </div>
        <div className="text-[11px] text-gray-500">
          Scores strictly evaluate comparative trade-offs (0.00 – 1.00) · Not yield predictions
        </div>
      </div>

      {/* Methodology Warning Banner */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
        <div className="flex items-start gap-2">
          <span className="text-amber-600 font-bold mt-0.5">⚠️</span>
          <div>
            <span className="font-bold">Water Requirement Methodology Note:</span> Rainfall coverage compares each crop with its own specific water requirement. Rice uses <strong>total requirement</strong> (including land preparation, puddling, and standing water / seepage: 948–1,232 mm), whereas legumes use <strong>crop water use</strong> (evapotranspiration: 175–288 mm). Therefore, rainfall coverage is <strong>NOT like-for-like across crops</strong>, and legume seasons will appear substantially higher partly due to this differing measurement basis.
          </div>
        </div>
      </div>

      {/* Three Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {evaluations.map((scenario) => {
          const confStyle = CONFIDENCE_STYLES[scenario.confidence.level];

          return (
            <div
              key={scenario.id}
              className={`flex flex-col rounded-xl border bg-white p-5 shadow-xs ${
                scenario.isExistingRotation
                  ? "border-blue-300 ring-1 ring-blue-100"
                  : "border-gray-200"
              }`}
            >
              {/* Card Header */}
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {scenario.id === "A"
                      ? "Strategy A (Existing)"
                      : scenario.id === "B"
                      ? "Strategy B (Legume)"
                      : "Strategy C (Diversified)"}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${confStyle.bg} ${confStyle.text} ${confStyle.border}`}
                  >
                    Confidence: {scenario.confidence.level.toUpperCase()} ({scenario.confidence.scorePercent}%)
                  </span>
                </div>
                <h3 className="mt-1 text-base font-bold text-gray-900">{scenario.title}</h3>
                <p className="mt-0.5 text-xs text-gray-500">{scenario.tagline}</p>
              </div>

              {/* 3-Season Sequence Timeline */}
              <div className="my-4 rounded-lg bg-gray-50 p-3 text-xs">
                <div className="font-semibold text-gray-700 mb-2">3-Season Sequence Timeline:</div>
                <div className="space-y-2">
                  {scenario.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b border-gray-100 pb-1.5 last:border-0 last:pb-0"
                    >
                      <span className="font-mono text-gray-500 text-[11px]">
                        S{idx + 1}: {step.seasonName}
                      </span>
                      <span className="font-semibold text-gray-900">{step.crop.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scores Breakdown */}
              <div className="space-y-3 border-y border-gray-100 py-4">
                {/* Composite Score */}
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-gray-900">Composite Score:</span>
                  {scenario.scores.rainfallCoverageStatus === "partial" ? (
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                          Partial ({scenario.scores.rainfallCoverageAssessedCount}/3 seasons)
                        </span>
                        <span className="font-mono text-xl font-extrabold text-gray-700">
                          {scenario.scores.compositeScore !== null
                            ? scenario.scores.compositeScore.toFixed(2)
                            : "N/A"}
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-700 font-medium">
                        (lower-bound, not comparable)
                      </div>
                    </div>
                  ) : (
                    <span className="font-mono text-xl font-extrabold text-gray-900">
                      {scenario.scores.compositeScore !== null
                        ? scenario.scores.compositeScore.toFixed(2)
                        : "N/A"}
                      <span className="text-xs font-normal text-gray-500"> / 1.00</span>
                    </span>
                  )}
                </div>

                {/* Rainfall Coverage */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 font-medium">Rainfall Coverage:</span>
                    <div className="flex items-center gap-1.5">
                      {scenario.scores.rainfallCoverageStatus === "partial" && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-medium text-amber-800">
                          Partial ({scenario.scores.rainfallCoverageAssessedCount}/3 seasons)
                        </span>
                      )}
                      {scenario.scores.rainfallCoverageStatus === "full" && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-medium text-emerald-800">
                          Full (3/3 seasons)
                        </span>
                      )}
                      <span className="font-mono font-semibold text-blue-700">
                        {scenario.scores.rainfallCoverage !== null
                          ? scenario.scores.rainfallCoverage.toFixed(2)
                          : "Not assessed"}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(100, (scenario.scores.rainfallCoverage || 0) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Ignores irrigation; 1.0 = rainfall alone meets requirement over growth window.
                  </p>
                </div>

                {/* Soil Health Score */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 font-medium">Soil Health &amp; Resilience:</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {scenario.scores.soilHealth.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(100, scenario.scores.soilHealth * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Economic Potential (Not assessed) */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Economic Potential:</span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-500">
                    Not assessed (no verified cost data)
                  </span>
                </div>
              </div>

              {/* Reasons (Citing NASA numbers) */}
              <div className="my-3 space-y-1.5">
                <div className="text-xs font-bold text-gray-800">Evidence &amp; Analysis:</div>
                <ul className="space-y-1 text-xs text-gray-600">
                  {scenario.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              {scenario.risks.length > 0 && (
                <div className="my-3 rounded-lg border border-rose-100 bg-rose-50/50 p-3 space-y-1.5">
                  <div className="text-xs font-bold text-rose-900">
                    Agronomic Risks Needing Local Expert Review:
                  </div>
                  <ul className="space-y-1 text-xs text-rose-800">
                    {scenario.risks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-500 mt-0.5">⚠️</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Explicit Data Gaps */}
              {scenario.dataGaps.length > 0 && (
                <div className="mt-auto pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                  <span className="font-semibold text-gray-700">Information Gaps:</span>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[11px]">
                    {scenario.dataGaps.map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
