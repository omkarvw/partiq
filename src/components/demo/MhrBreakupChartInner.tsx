"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { formatInr } from "@/lib/costing";
import type { BreakupSlice } from "./MhrBreakupChart";

export default function MhrBreakupChartInner({
  slices,
  total,
}: {
  slices: BreakupSlice[];
  total: number;
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {slices.map((s) => (
              <Cell key={s.key} fill={s.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              const safe = Number.isFinite(n) ? n : 0;
              const share = total > 0 ? (safe / total) * 100 : 0;
              return [`${formatInr(safe)}/hr (${share.toFixed(0)}%)`, ""];
            }}
            contentStyle={{
              borderRadius: 4,
              border: "1px solid #bcc9c6",
              fontSize: 12,
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
