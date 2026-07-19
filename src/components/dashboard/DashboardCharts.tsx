"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatInr } from "@/lib/costing";

type WeekPoint = { week: string; estimated: number; actual: number };
type VersionPoint = {
  label: string;
  estimated: number;
  actual: number | null;
};

export function PlantWeeklyChart({ data }: { data: WeekPoint[] }) {
  return (
    <div className="h-72 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid stroke="#bcc9c6" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#3d4947" }} />
          <YAxis tick={{ fontSize: 12, fill: "#3d4947" }} />
          <Tooltip
            contentStyle={{
              borderRadius: 4,
              border: "1px solid #bcc9c6",
              fontSize: 12,
            }}
          />
          <Legend />
          <Bar dataKey="estimated" name="Estimated" fill="#94a3b8" radius={[2, 2, 0, 0]} />
          <Bar dataKey="actual" name="Actual" fill="#00685f" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PartWeeklyChart({ data }: { data: WeekPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-72 p-4">
        <p className="text-body-sm text-on-surface-variant">No weekly data for this part.</p>
      </div>
    );
  }
  return (
    <div className="h-72 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid stroke="#bcc9c6" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#3d4947" }} />
          <YAxis tick={{ fontSize: 12, fill: "#3d4947" }} />
          <Tooltip
            contentStyle={{
              borderRadius: 4,
              border: "1px solid #bcc9c6",
              fontSize: 12,
            }}
          />
          <Legend />
          <Bar dataKey="estimated" name="Estimated" fill="#94a3b8" radius={[2, 2, 0, 0]} />
          <Bar dataKey="actual" name="Actual" fill="#00685f" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VersionCostChart({ data }: { data: VersionPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-80 p-4">
        <p className="text-body-sm text-on-surface-variant">
          No versions to chart for this process.
        </p>
      </div>
    );
  }
  return (
    <div className="h-80 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#bcc9c6" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#3d4947" }}
            tickMargin={10}
            height={36}
            axisLine={{ stroke: "#bcc9c6" }}
            tickLine={{ stroke: "#bcc9c6" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#3d4947" }}
            tickFormatter={(v) => `₹${v}`}
            width={56}
          />
          <Tooltip
            formatter={(value) => {
              if (value === null || value === undefined) return "—";
              return formatInr(typeof value === "number" ? value : Number(value));
            }}
            labelFormatter={(label) => `Version ${label}`}
            contentStyle={{
              borderRadius: 4,
              border: "1px solid #bcc9c6",
              fontSize: 12,
            }}
          />
          <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 16 }} />
          <Line
            type="monotone"
            dataKey="estimated"
            name="Estimated"
            stroke="#94a3b8"
            strokeWidth={2}
            dot={{ r: 4, fill: "#94a3b8" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#00685f"
            strokeWidth={2}
            dot={{ r: 4, fill: "#00685f" }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
