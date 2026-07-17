"use client";

import Link from "next/link";
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
import { ArrowUpRight, Clock3, IndianRupee, AlertTriangle } from "lucide-react";
import { dashboardSignals, parts, weeklyTrend, getCurrentVersion } from "@/lib/data";
import { calcCost, formatInr, variancePct } from "@/lib/costing";
import { Panel, VarianceChip } from "@/components/ui/Primitives";

export default function DashboardPage() {
  let totalEstCost = 0;
  let totalActCost = 0;
  let totalEstTime = 0;
  let totalActTime = 0;

  parts.forEach((part) => {
    part.processes.forEach((proc) => {
      const v = getCurrentVersion(proc);
      totalEstCost += calcCost(v.mhr, v.timeEstimatedMin);
      totalActCost += calcCost(v.mhr, v.timeActualMin);
      totalEstTime += v.timeEstimatedMin;
      totalActTime += v.timeActualMin;
    });
  });

  const timeVar = variancePct(totalEstTime, totalActTime);
  const costVar = variancePct(totalEstCost, totalActCost);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-headline-lg text-on-surface">Production Signals</h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Estimated vs actual time and cost across active processes.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Est. process cost"
          value={formatInr(totalEstCost)}
          icon={<IndianRupee className="h-4 w-4" />}
        />
        <Kpi
          label="Act. process cost"
          value={formatInr(totalActCost)}
          icon={<IndianRupee className="h-4 w-4" />}
          chip={<VarianceChip pct={costVar} />}
        />
        <Kpi
          label="Est. cycle time"
          value={`${Math.round(totalEstTime)} min`}
          icon={<Clock3 className="h-4 w-4" />}
        />
        <Kpi
          label="Act. cycle time"
          value={`${Math.round(totalActTime)} min`}
          icon={<Clock3 className="h-4 w-4" />}
          chip={<VarianceChip pct={timeVar} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Weekly cost trend (₹)" className="xl:col-span-2">
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend} barGap={4}>
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
        </Panel>

        <Panel
          title="Active signals"
          action={
            <span className="label-caps text-on-surface-variant">
              {dashboardSignals.length} alerts
            </span>
          }
        >
          <ul className="divide-y divide-outline-variant/50">
            {dashboardSignals.map((s) => (
              <li key={s.id} className="px-4 py-3 hover:bg-surface-low/60">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href="/parts/part-mid-3060"
                        className="cursor-pointer font-mono text-code-md text-primary hover:underline"
                      >
                        {s.partCode}
                      </Link>
                      <VarianceChip pct={s.variancePct} />
                    </div>
                    <p className="mt-0.5 text-body-sm text-on-surface">
                      {s.processName} · {s.message}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-outline-variant px-4 py-3">
            <Link
              href="/parts"
              className="inline-flex cursor-pointer items-center gap-1 text-body-sm font-medium text-primary hover:underline"
            >
              Review parts <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  chip,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  chip?: React.ReactNode;
}) {
  return (
    <div className="rounded border border-outline-variant bg-surface-lowest p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="label-caps text-on-surface-variant">{label}</span>
        <span className="text-secondary">{icon}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="font-mono text-headline-md text-on-surface">{value}</p>
        {chip}
      </div>
    </div>
  );
}
