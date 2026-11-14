"use client";

import {
  SoilFormState,
  DataConfidenceLabel,
  SoilTextureType,
  SoilDrainageType,
  SoilOrganicCarbonType,
} from "@/lib/types/engine";

interface SoilFormProps {
  value: SoilFormState;
  onChange: (updated: SoilFormState) => void;
}

const CONFIDENCE_BADGES: Record<
  DataConfidenceLabel,
  { label: string; bg: string; text: string; border: string }
> = {
  measured: {
    label: "Measured (Lab)",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  estimated: {
    label: "Estimated (Field)",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  unknown: {
    label: "Unknown",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
  },
};

export default function SoilForm({ value, onChange }: SoilFormProps) {
  const updateField = <K extends keyof SoilFormState>(key: K, val: SoilFormState[K]) => {
    onChange({
      ...value,
      [key]: val,
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">3. Local Soil Characteristics</h2>
          <span className="text-xs text-gray-500">Field-level inputs</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Enter your soil conditions. Any field can be &quot;Unknown&quot; — the tool never silently assumes default values.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Soil pH */}
        <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-800">
              Soil pH (Acidity / Alkalinity)
            </label>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                CONFIDENCE_BADGES[value.phConfidence].bg
              } ${CONFIDENCE_BADGES[value.phConfidence].text} ${
                CONFIDENCE_BADGES[value.phConfidence].border
              }`}
            >
              {CONFIDENCE_BADGES[value.phConfidence].label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="3.5"
              max="9.5"
              placeholder="e.g. 6.5"
              value={value.ph !== null ? value.ph : ""}
              disabled={value.phConfidence === "unknown"}
              onChange={(e) => {
                const val = e.target.value ? parseFloat(e.target.value) : null;
                updateField("ph", val);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 shadow-xs focus:border-blue-500 focus:outline-hidden disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-gray-500">Source:</span>
            {(["measured", "estimated", "unknown"] as DataConfidenceLabel[]).map((conf) => (
              <button
                key={conf}
                type="button"
                onClick={() => {
                  updateField("phConfidence", conf);
                  if (conf === "unknown") updateField("ph", null);
                }}
                className={`rounded px-2 py-0.5 capitalize transition-colors ${
                  value.phConfidence === conf
                    ? "bg-blue-600 font-medium text-white"
                    : "bg-white text-gray-600 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {conf}
              </button>
            ))}
          </div>
        </div>

        {/* Soil Texture */}
        <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-800">Soil Texture Class</label>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                CONFIDENCE_BADGES[value.textureConfidence].bg
              } ${CONFIDENCE_BADGES[value.textureConfidence].text} ${
                CONFIDENCE_BADGES[value.textureConfidence].border
              }`}
            >
              {CONFIDENCE_BADGES[value.textureConfidence].label}
            </span>
          </div>

          <select
            value={value.texture}
            onChange={(e) => {
              const val = e.target.value as SoilTextureType;
              updateField("texture", val);
              if (val === "unknown") updateField("textureConfidence", "unknown");
              else if (value.textureConfidence === "unknown")
                updateField("textureConfidence", "estimated");
            }}
            className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 shadow-xs focus:border-blue-500 focus:outline-hidden"
          >
            <option value="unknown">Unknown / Not reported</option>
            <option value="sandy">Sandy / Sandy Loam (High percolation)</option>
            <option value="loam">Loam / Reddish Brown Earth (Upland typical)</option>
            <option value="clay_loam">Clay Loam (Moderate retention)</option>
            <option value="heavy_clay">Heavy Clay / Low Humic Gley (Paddy bottomland)</option>
          </select>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-gray-500">Source:</span>
            {(["measured", "estimated", "unknown"] as DataConfidenceLabel[]).map((conf) => (
              <button
                key={conf}
                type="button"
                onClick={() => {
                  updateField("textureConfidence", conf);
                  if (conf === "unknown") updateField("texture", "unknown");
                }}
                className={`rounded px-2 py-0.5 capitalize transition-colors ${
                  value.textureConfidence === conf
                    ? "bg-blue-600 font-medium text-white"
                    : "bg-white text-gray-600 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {conf}
              </button>
            ))}
          </div>
        </div>

        {/* Soil Organic Carbon */}
        <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-800">Organic Carbon (SOC)</label>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                CONFIDENCE_BADGES[value.organicCarbonConfidence].bg
              } ${CONFIDENCE_BADGES[value.organicCarbonConfidence].text} ${
                CONFIDENCE_BADGES[value.organicCarbonConfidence].border
              }`}
            >
              {CONFIDENCE_BADGES[value.organicCarbonConfidence].label}
            </span>
          </div>

          <select
            value={value.organicCarbon}
            onChange={(e) => {
              const val = e.target.value as SoilOrganicCarbonType;
              updateField("organicCarbon", val);
              if (val === "unknown") updateField("organicCarbonConfidence", "unknown");
              else if (value.organicCarbonConfidence === "unknown")
                updateField("organicCarbonConfidence", "estimated");
            }}
            className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 shadow-xs focus:border-blue-500 focus:outline-hidden"
          >
            <option value="unknown">Unknown / Not tested</option>
            <option value="low">Low (&lt; 1.0%) — typical in degraded Dry Zone</option>
            <option value="medium">Medium (1.0% – 2.0%) — moderate organic matter</option>
            <option value="high">High (&gt; 2.0%) — rich organic status</option>
          </select>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-gray-500">Source:</span>
            {(["measured", "estimated", "unknown"] as DataConfidenceLabel[]).map((conf) => (
              <button
                key={conf}
                type="button"
                onClick={() => {
                  updateField("organicCarbonConfidence", conf);
                  if (conf === "unknown") updateField("organicCarbon", "unknown");
                }}
                className={`rounded px-2 py-0.5 capitalize transition-colors ${
                  value.organicCarbonConfidence === conf
                    ? "bg-blue-600 font-medium text-white"
                    : "bg-white text-gray-600 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {conf}
              </button>
            ))}
          </div>
        </div>

        {/* Soil Drainage */}
        <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-800">
              Drainage &amp; Water Table
            </label>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                CONFIDENCE_BADGES[value.drainageConfidence].bg
              } ${CONFIDENCE_BADGES[value.drainageConfidence].text} ${
                CONFIDENCE_BADGES[value.drainageConfidence].border
              }`}
            >
              {CONFIDENCE_BADGES[value.drainageConfidence].label}
            </span>
          </div>

          <select
            value={value.drainage}
            onChange={(e) => {
              const val = e.target.value as SoilDrainageType;
              updateField("drainage", val);
              if (val === "unknown") updateField("drainageConfidence", "unknown");
              else if (value.drainageConfidence === "unknown")
                updateField("drainageConfidence", "estimated");
            }}
            className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 shadow-xs focus:border-blue-500 focus:outline-hidden"
          >
            <option value="unknown">Unknown</option>
            <option value="well_drained">Well-drained (Upland RBE slopes)</option>
            <option value="imperfect">Imperfectly drained (Mid-slope)</option>
            <option value="poor_waterlogged">
              Poor / Waterlogged (Bottomland Low Humic Gley)
            </option>
            <option value="excessive">Excessive (Coarse sand/gravel)</option>
          </select>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-gray-500">Source:</span>
            {(["measured", "estimated", "unknown"] as DataConfidenceLabel[]).map((conf) => (
              <button
                key={conf}
                type="button"
                onClick={() => {
                  updateField("drainageConfidence", conf);
                  if (conf === "unknown") updateField("drainage", "unknown");
                }}
                className={`rounded px-2 py-0.5 capitalize transition-colors ${
                  value.drainageConfidence === conf
                    ? "bg-blue-600 font-medium text-white"
                    : "bg-white text-gray-600 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {conf}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
