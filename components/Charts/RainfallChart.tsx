"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MonthlyClimatology } from "@/lib/types/nasa";

interface RainfallChartProps {
  data: MonthlyClimatology[];
}

export default function RainfallChart({ data }: RainfallChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Monthly Rainfall Totals (mm)
        </h3>
        <p className="text-xs text-gray-500">
          10-year multi-year average monthly precipitation (NASA POWER: PRECTOTCORR)
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="monthName" tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
            <YAxis
              unit=" mm"
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              fontSize={12}
            />
            <Tooltip
              formatter={(value) => {
                const val = typeof value === "number" ? value : Number(value) || 0;
                return [`${val.toFixed(1)} mm`, "Avg Monthly Rainfall"];
              }}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="avgMonthlyRainfallMm"
              fill="#2563eb"
              radius={[4, 4, 0, 0]}
              name="Rainfall"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
        <span>Maha peaks: Oct – Jan</span>
        <span>Yala dry period: Jun – Aug</span>
      </div>
    </div>
  );
}
