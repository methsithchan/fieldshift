"use client";

import { ASSUMPTIONS_LIST } from "@/lib/engine/assumptions";

export default function ModelAssumptionsPanel() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Model Assumptions (Not Validated by an Agronomist)
          </h2>
          <p className="text-xs text-gray-500">
            All rule-based penalties, bonuses, and growth window thresholds used by the scoring engine.
          </p>
        </div>
        <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200 self-start sm:self-auto">
          Transparent Heuristics
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <th className="py-2.5 px-3 font-semibold">Parameter / Rule</th>
              <th className="py-2.5 px-3 font-semibold">Category</th>
              <th className="py-2.5 px-3 font-semibold">Engine Value</th>
              <th className="py-2.5 px-3 font-semibold">Description</th>
              <th className="py-2.5 px-3 font-semibold">Validation Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ASSUMPTIONS_LIST.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="py-2.5 px-3 font-medium text-gray-900">{item.name}</td>
                <td className="py-2.5 px-3 uppercase text-[10px] font-mono text-gray-500">
                  {item.category}
                </td>
                <td className="py-2.5 px-3 font-mono font-semibold text-gray-800">
                  {item.value} {item.unit}
                </td>
                <td className="py-2.5 px-3 text-gray-600">{item.description}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                      item.validationStatus === "doa recommendation"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : item.validationStatus === "agronomic convention"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {item.validationStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
