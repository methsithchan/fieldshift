"use client";

import { CROP_LIST } from "@/data/crops";

interface ExistingRotationSelectorProps {
  existingCropIds: [string, string, string];
  onChange: (updated: [string, string, string]) => void;
}

export default function ExistingRotationSelector({
  existingCropIds,
  onChange,
}: ExistingRotationSelectorProps) {
  const handleCropChange = (seasonIndex: 0 | 1 | 2, newCropId: string) => {
    const updated: [string, string, string] = [...existingCropIds];
    updated[seasonIndex] = newCropId;
    onChange(updated);
  };

  const seasonLabels = [
    { name: "Season 1 (Maha - Year 1)", sub: "Major monsoon season" },
    { name: "Season 2 (Yala - Year 1)", sub: "Dry / minor season" },
    { name: "Season 3 (Maha - Year 2)", sub: "Major monsoon season" },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Customize Strategy A: Your Existing Rotation
          </h2>
          <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200">
            Baseline
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Select what you currently cultivate across the 3 consecutive seasons to compare against alternative strategies.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {seasonLabels.map((s, idx) => (
          <div
            key={s.name}
            className="space-y-1.5 rounded-lg border border-gray-100 bg-gray-50/50 p-3"
          >
            <div className="text-xs font-semibold text-gray-800">{s.name}</div>
            <div className="text-[10px] text-gray-500">{s.sub}</div>
            <select
              value={existingCropIds[idx]}
              onChange={(e) => handleCropChange(idx as 0 | 1 | 2, e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 shadow-xs focus:border-blue-500 focus:outline-hidden"
            >
              {CROP_LIST.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
