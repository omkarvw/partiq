"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  IndianRupee,
  AlertTriangle,
  Factory,
  FileQuestion,
  ScrollText,
  MessagesSquare,
} from "lucide-react";
import {
  dashboardSignals,
  getCommercialPipelineSummary,
  getCurrentVersion,
  getPartSignals,
  getPlantTotals,
  getProcessVersionCostTrend,
  parts,
  partWeeklyTrends,
  plantWeeklyTrend,
} from "@/lib/data";
import { calcCost, formatDurationSeconds, formatInr, toSeconds, variancePct } from "@/lib/costing";
import { Panel, StatusChip, VarianceChip } from "@/components/ui/Primitives";
import type { PipelineStageCount } from "@/lib/types";

const PlantWeeklyChart = dynamic(
  () =>
    import("@/components/dashboard/DashboardCharts").then((m) => m.PlantWeeklyChart),
  { ssr: false, loading: () => <ChartSkeleton height="h-72" /> },
);
const PartWeeklyChart = dynamic(
  () =>
    import("@/components/dashboard/DashboardCharts").then((m) => m.PartWeeklyChart),
  { ssr: false, loading: () => <ChartSkeleton height="h-72" /> },
);
const VersionCostChart = dynamic(
  () =>
    import("@/components/dashboard/DashboardCharts").then((m) => m.VersionCostChart),
  { ssr: false, loading: () => <ChartSkeleton height="h-80" /> },
);

function ChartSkeleton({ height }: { height: string }) {
  return (
    <div className={`${height} flex items-center justify-center p-4`}>
      <p className="text-body-sm text-on-surface-variant">Loading chart…</p>
    </div>
  );
}

export default function DashboardPage() {
  const [partId, setPartId] = useState(parts[0]?.id ?? "");
  const [processId, setProcessId] = useState(parts[0]?.processes[0]?.id ?? "");

  const part = parts.find((p) => p.id === partId) ?? parts[0];

  useEffect(() => {
    if (!part) return;
    const stillValid = part.processes.some((p) => p.id === processId);
    if (!stillValid) setProcessId(part.processes[0]?.id ?? "");
  }, [part, processId]);

  const plant = getPlantTotals();
  const pipeline = getCommercialPipelineSummary();
  const plantTimeVar = variancePct(plant.estTimeSec, plant.actTimeSec);
  const plantCostVar = variancePct(plant.estCost, plant.actCost);

  const partMetrics = useMemo(() => {
    if (!part) return { estCost: 0, actCost: 0, estTimeSec: 0, actTimeSec: 0 };
    let estCost = 0;
    let actCost = 0;
    let estTimeSec = 0;
    let actTimeSec = 0;
    part.processes.forEach((proc) => {
      const v = getCurrentVersion(proc);
      estCost += calcCost(v.mhr, v.timeEstimated, v.timeUnit);
      actCost += calcCost(v.mhr, v.timeActual, v.timeUnit);
      estTimeSec += toSeconds(v.timeEstimated, v.timeUnit);
      actTimeSec += toSeconds(v.timeActual, v.timeUnit);
    });
    return { estCost, actCost, estTimeSec, actTimeSec };
  }, [part]);

  const partWeekly = part ? (partWeeklyTrends[part.id] ?? []) : [];
  const partSignals = part ? getPartSignals(part.code) : [];
  const selectedProcess = part?.processes.find((p) => p.id === processId);
  const versionLine =
    part && processId ? getProcessVersionCostTrend(part.id, processId) : [];

  const partTimeVar = variancePct(partMetrics.estTimeSec, partMetrics.actTimeSec);
  const partCostVar = variancePct(partMetrics.estCost, partMetrics.actCost);

  if (!part) {
    return <div className="p-8 text-body-md">No parts available.</div>;
  }

  return (
    <div className="space-y-10 p-8">
      <section>
        <div className="mb-6">
          <h2 className="text-headline-lg text-on-surface">Plant overview</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Aggregate estimated vs actual across all parts and current process versions.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Est. process cost" value={formatInr(plant.estCost)} icon={<IndianRupee className="h-4 w-4" />} />
          <Kpi label="Act. process cost" value={formatInr(plant.actCost)} icon={<IndianRupee className="h-4 w-4" />} chip={<VarianceChip pct={plantCostVar} />} />
          <Kpi label="Est. cycle time" value={formatDurationSeconds(plant.estTimeSec)} icon={<Clock3 className="h-4 w-4" />} />
          <Kpi label="Act. cycle time" value={formatDurationSeconds(plant.actTimeSec)} icon={<Clock3 className="h-4 w-4" />} chip={<VarianceChip pct={plantTimeVar} />} />
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-headline-sm text-on-surface">Commercial pipeline</h3>
          <p className="mb-4 text-body-sm text-on-surface-variant">
            Totals and stage breakdown for parts, enquiries (RFQs), quotations, and customer responses.
          </p>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Total parts" value={String(pipeline.partsTotal)} icon={<Factory className="h-4 w-4" />} />
            <Kpi label="Total RFQs" value={String(pipeline.enquiriesTotal)} icon={<FileQuestion className="h-4 w-4" />} />
            <Kpi label="Total quotations" value={String(pipeline.quotationsTotal)} icon={<ScrollText className="h-4 w-4" />} />
            <Kpi label="Customer responses" value={String(pipeline.responsesTotal)} icon={<MessagesSquare className="h-4 w-4" />} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <PipelinePanel title="Parts by status" stages={pipeline.partsByStatus} />
            <PipelinePanel title="RFQs by status" stages={pipeline.enquiriesByStatus} />
            <PipelinePanel title="Quotations by status" stages={pipeline.quotationsByStatus} />
            <PipelinePanel title="Responses by outcome" stages={pipeline.responsesByOutcome} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Panel title="Weekly cost trend · Plant (₹)" className="xl:col-span-2">
            <PlantWeeklyChart data={plantWeeklyTrend} />
          </Panel>
          <Panel
            title="Active signals"
            action={<span className="label-caps text-on-surface-variant">{dashboardSignals.length} alerts</span>}
          >
            <ul className="divide-y divide-outline-variant/50">
              {dashboardSignals.map((s) => (
                <li key={s.id} className="px-4 py-3 hover:bg-surface-low/60">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-code-md text-primary">{s.partCode}</span>
                        <VarianceChip pct={s.variancePct} />
                      </div>
                      <p className="mt-0.5 text-body-sm text-on-surface">{s.processName} · {s.message}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-outline-variant px-4 py-3">
              <Link href="/parts" className="inline-flex cursor-pointer items-center gap-1 text-body-sm font-medium text-primary hover:underline">
                Review parts <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Panel>
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-t border-outline-variant pt-8">
          <div>
            <h2 className="text-headline-lg text-on-surface">Part view</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Drill into one part’s costs, weekly trend, and process-version history.
            </p>
          </div>
          <label className="block min-w-[220px]">
            <span className="label-caps mb-1 block text-on-surface-variant">Part</span>
            <select
              value={part.id}
              onChange={(e) => setPartId(e.target.value)}
              className="w-full cursor-pointer rounded-sm border border-outline-variant bg-surface-lowest px-3 py-2 font-mono text-code-md text-on-surface focus:border-primary"
            >
              {parts.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-2 flex items-center gap-2">
          <span className="label-caps text-on-surface-variant">Viewing</span>
          <Link href={`/parts/${part.id}`} className="cursor-pointer font-mono text-code-md font-medium text-primary hover:underline">
            {part.code}
          </Link>
          <span className="text-body-sm text-on-surface-variant">· {part.material}</span>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Est. process cost" value={formatInr(partMetrics.estCost)} icon={<IndianRupee className="h-4 w-4" />} />
          <Kpi label="Act. process cost" value={formatInr(partMetrics.actCost)} icon={<IndianRupee className="h-4 w-4" />} chip={<VarianceChip pct={partCostVar} />} />
          <Kpi label="Est. cycle time" value={formatDurationSeconds(partMetrics.estTimeSec)} icon={<Clock3 className="h-4 w-4" />} />
          <Kpi label="Act. cycle time" value={formatDurationSeconds(partMetrics.actTimeSec)} icon={<Clock3 className="h-4 w-4" />} chip={<VarianceChip pct={partTimeVar} />} />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Panel title={`Weekly cost trend · ${part.code} (₹)`} className="xl:col-span-2">
            <PartWeeklyChart data={partWeekly} />
          </Panel>
          <Panel
            title="Part signals"
            action={<span className="label-caps text-on-surface-variant">{partSignals.length} alerts</span>}
          >
            {partSignals.length === 0 ? (
              <p className="p-4 text-body-sm text-on-surface-variant">No overrun signals for this part.</p>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {partSignals.map((s) => (
                  <li key={s.id} className="px-4 py-3 hover:bg-surface-low/60">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-code-md text-on-surface">{s.processName}</span>
                          <VarianceChip pct={s.variancePct} />
                        </div>
                        <p className="mt-0.5 text-body-sm text-on-surface-variant">{s.message}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-outline-variant px-4 py-3">
              <Link href={`/parts/${part.id}`} className="inline-flex cursor-pointer items-center gap-1 text-body-sm font-medium text-primary hover:underline">
                Open part detail <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Panel>
        </div>

        <Panel
          title={`Process version cost trend · ${part.code}`}
          action={
            <label className="flex items-center gap-2">
              <span className="label-caps text-on-surface-variant">Process</span>
              <select
                value={processId}
                onChange={(e) => setProcessId(e.target.value)}
                className="cursor-pointer rounded-sm border border-outline-variant bg-surface-lowest px-2 py-1.5 font-mono text-code-sm text-on-surface focus:border-primary"
              >
                {part.processes.map((p) => (
                  <option key={p.id} value={p.id}>{p.name.split(" - ")[0]}</option>
                ))}
              </select>
            </label>
          }
        >
          <p className="border-b border-outline-variant/50 px-4 py-2 text-body-sm text-on-surface-variant">
            Line chart of estimated vs actual cost across versions of{" "}
            <span className="font-medium text-on-surface">{selectedProcess?.name ?? "selected process"}</span>
            . Draft versions show estimated only until actual time is recorded.
          </p>
          <VersionCostChart data={versionLine} />
        </Panel>
      </section>
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

function PipelinePanel({ title, stages }: { title: string; stages: PipelineStageCount[] }) {
  const total = stages.reduce((sum, s) => sum + s.count, 0);
  return (
    <Panel title={title}>
      <ul className="divide-y divide-outline-variant/50">
        {stages.map((s) => {
          const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
          return (
            <li key={s.stage} className="px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <StatusChip status={s.stage} />
                <span className="font-mono text-code-md text-on-surface">
                  {s.count}
                  <span className="ml-1 text-code-sm text-on-surface-variant">({pct}%)</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
