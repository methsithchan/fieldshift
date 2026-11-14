"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MonthlyClimatology } from "@/lib/types/nasa";

interface SoilWetnessChartProps {
  data: MonthlyClimatology[];
}

export default function SoilWetnessChart({ data }: SoilWetnessChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Root-Zone Soil Wetness (0 – 1)
        </h3>
        <p className="text-xs text-gray-500">
          Monthly mean soil wetness in root zone (NASA POWER: GWETROOT; 0 = dry, 1 = saturated)
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="wetnessGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="monthName" tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1.0]}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              fontSize={12}
            />
            <Tooltip
              formatter={(value) => {
                const val = typeof value === "number" ? value : Number(value) || 0;
                return [`${val.toFixed(3)}`, "Root-Zone Wetness"];
              }}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="avgSoilWetness"
              stroke="#059669"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#wetnessGradient)"
              name="Soil Wetness"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
        <span>Scale: 0.0 (minimum wetness) to 1.0 (saturation)</span>
        <span>Dimensionless index</span>
      </div>
    </div>
  );
}
