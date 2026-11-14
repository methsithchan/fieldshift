"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MonthlyClimatology } from "@/lib/types/nasa";

interface TemperatureChartProps {
  data: MonthlyClimatology[];
}

export default function TemperatureChart({ data }: TemperatureChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Monthly Mean Temperature (°C)
        </h3>
        <p className="text-xs text-gray-500">
          10-year monthly mean daily 2-meter air temperature (NASA POWER: T2M)
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="monthName" tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
            <YAxis
              unit="°C"
              domain={["dataMin - 2", "dataMax + 2"]}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              fontSize={12}
            />
            <Tooltip
              formatter={(value) => {
                const val = typeof value === "number" ? value : Number(value) || 0;
                return [`${val.toFixed(1)} °C`, "Mean Temperature"];
              }}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="avgTemperatureC"
              stroke="#ea580c"
              strokeWidth={3}
              dot={{ r: 4, fill: "#ea580c" }}
              activeDot={{ r: 6 }}
              name="Temperature"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
        <span>2-Meter Air Temperature (T2M)</span>
        <span>Monthly multi-year means</span>
      </div>
    </div>
  );
}
