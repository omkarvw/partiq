"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatInr } from "@/lib/costing";

export default function MhrCompareChartInner({
  data,
}: {
  data: { name: string; baseline: number; current: number }[];
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid
            stroke="#bcc9c6"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#3d4947" }} />
          <YAxis
            tick={{ fontSize: 11, fill: "#3d4947" }}
            tickFormatter={(v) => `${Math.round(v)}`}
          />
          <Tooltip
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              return `${formatInr(Number.isFinite(n) ? n : 0)}/hr`;
            }}
            contentStyle={{
              borderRadius: 4,
              border: "1px solid #bcc9c6",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="baseline"
            name="Baseline"
            fill="#94a3b8"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="current"
            name="Now"
            fill="#00685f"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
