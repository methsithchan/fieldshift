"use client";

import { PriorityWeights } from "@/lib/types/engine";

interface PrioritySlidersProps {
  weights: PriorityWeights;
  onChange: (updated: PriorityWeights) => void;
}

export default function PrioritySliders({ weights, onChange }: PrioritySlidersProps) {
  const handleRainfallChange = (newRainfall: number) => {
    const clamped = Math.max(0, Math.min(100, newRainfall));
    onChange({
      ...weights,
      rainfallCoverage: clamped,
      soilHealth: 100 - clamped,
    });
  };

  const handleSoilChange = (newSoil: number) => {
    const clamped = Math.max(0, Math.min(100, newSoil));
    onChange({
      ...weights,
      soilHealth: clamped,
      rainfallCoverage: 100 - clamped,
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">4. Priority Weights</h2>
          <span className="text-xs text-gray-500 font-mono">
            Active Sum: {weights.rainfallCoverage + weights.soilHealth}%
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Adjust the relative priority for scenario scoring. Economic potential is excluded until verified price/cost data is available.
        </p>
      </div>

      <div className="space-y-4">
        {/* Rainfall Coverage Slider */}
        <div className="space-y-1.5 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-800">
            <span>Rainfall Coverage Priority</span>
            <span className="font-mono text-blue-600">{weights.rainfallCoverage}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={weights.rainfallCoverage}
            onChange={(e) => handleRainfallChange(parseInt(e.target.value, 10))}
            className="w-full accent-blue-600"
          />
          <p className="text-[11px] text-gray-500">
            Rainfall coverage ignores tank/canal irrigation; 1.0 means rainfall alone meets the crop requirement over the growth window.
          </p>
        </div>

        {/* Soil Health Slider */}
        <div className="space-y-1.5 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-800">
            <span>Soil Health &amp; Resilience Priority</span>
            <span className="font-mono text-emerald-600">{weights.soilHealth}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={weights.soilHealth}
            onChange={(e) => handleSoilChange(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-600"
          />
          <p className="text-[11px] text-gray-500">
            Emphasizes legume biological nitrogen fixation, organic matter addition, and avoidance of continuous monoculture.
          </p>
        </div>

        {/* Economic Potential (Disabled) */}
        <div className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-100/70 p-3 opacity-75">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Economic Potential Priority</span>
            <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-mono font-medium text-gray-600">
              Not assessed
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            disabled
            value={0}
            className="w-full cursor-not-allowed opacity-50"
          />
          <p className="text-[11px] text-gray-500 italic">
            Excluded from composite score. No verified production cost or farm-gate price data exists in reviewed Sri Lankan sources.
          </p>
        </div>
      </div>
    </div>
  );
}
