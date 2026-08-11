"use client";

import dynamic from "next/dynamic";
import type { MhrBreakup } from "@/lib/factory/types";
import { formatInr } from "@/lib/costing";

const PieInner = dynamic(() => import("./MhrBreakupChartInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">
      Loading chart…
    </div>
  ),
});

const CompareInner = dynamic(() => import("./MhrCompareChartInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center text-body-sm text-on-surface-variant">
      Loading chart…
    </div>
  ),
});

export type BreakupSlice = {
  key: string;
  name: string;
  value: number;
  color: string;
};

export function breakupSlices(breakup: MhrBreakup): BreakupSlice[] {
  return [
    { key: "emi", name: "EMI", value: breakup.emiPerHour, color: "#0d1c2e" },
    {
      key: "labour",
      name: "Labour",
      value: breakup.labourPerHour,
      color: "#00685f",
    },
    {
      key: "utility",
      name: "Utility",
      value: breakup.utilityPerHour,
      color: "#008378",
    },
    {
      key: "tooling",
      name: "Tooling",
      value: breakup.toolingPerHour,
      color: "#515f74",
    },
    {
      key: "oh",
      name: "Factory OH",
      value: breakup.ohPerHour,
      color: "#94a3b8",
    },
    {
      key: "maint",
      name: "Maintenance",
      value: breakup.maintenancePerHour,
      color: "#b9c7df",
    },
  ].filter((s) => s.value > 0);
}

export function MhrBreakupChart({
  breakup,
  title = "Cash MHR mix",
}: {
  breakup: MhrBreakup;
  title?: string;
}) {
  const slices = breakupSlices(breakup);
  return (
    <div className="rounded border border-outline-variant bg-surface-lowest p-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h4 className="text-headline-sm text-on-surface">{title}</h4>
        <p className="font-mono text-code-md tabular-nums text-primary">
          {formatInr(breakup.manufacturingMhr)}/hr
        </p>
      </div>
      <PieInner slices={slices} total={breakup.manufacturingMhr} />
    </div>
  );
}

export function MhrCompareChart({
  baseline,
  current,
}: {
  baseline: MhrBreakup;
  current: MhrBreakup;
}) {
  const keys = [
    { key: "emiPerHour", name: "EMI" },
    { key: "labourPerHour", name: "Labour" },
    { key: "utilityPerHour", name: "Utility" },
    { key: "toolingPerHour", name: "Tooling" },
    { key: "ohPerHour", name: "OH" },
    { key: "maintenancePerHour", name: "Maint." },
  ] as const;

  const data = keys.map((k) => ({
    name: k.name,
    baseline: baseline[k.key],
    current: current[k.key],
  }));

  return (
    <div className="rounded border border-outline-variant bg-surface-lowest p-4">
      <h4 className="mb-2 text-headline-sm text-on-surface">
        Cost heads · baseline vs now
      </h4>
      <CompareInner data={data} />
    </div>
  );
}
