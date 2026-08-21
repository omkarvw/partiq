"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatInr } from "@/lib/costing";
import type { CostCompositionAnnual, MhrBreakup } from "@/lib/factory/types";
import { AnimatedNumber } from "@/components/motion/motion-kit";

export type CompositionHeadKey = keyof Pick<
  CostCompositionAnnual,
  "labour" | "utility" | "overhead" | "emi" | "tooling" | "maintenance"
>;

const HEADS: {
  key: CompositionHeadKey;
  label: string;
  hint: string;
}[] = [
  { key: "labour", label: "Direct labour", hint: "Shop-floor crew loaded cost" },
  { key: "utility", label: "Utilities", hint: "Power + consumables" },
  { key: "overhead", label: "Factory overhead", hint: "White collar, rent, fixed" },
  { key: "emi", label: "EMI / finance", hint: "Machine loan cost" },
  { key: "tooling", label: "Tooling", hint: "Inserts, cutters, fixtures" },
  { key: "maintenance", label: "Maintenance", hint: "AMC, PM, spares" },
];

function annualForHead(b: MhrBreakup, key: CompositionHeadKey): number {
  const hrs = b.productiveHoursYear;
  switch (key) {
    case "labour":
      return b.labourPerHour * hrs;
    case "utility":
      return b.utilityPerHour * hrs;
    case "overhead":
      return b.ohPerHour * hrs;
    case "emi":
      return b.emiPerHour * hrs;
    case "tooling":
      return b.toolingPerHour * hrs;
    case "maintenance":
      return b.maintenancePerHour * hrs;
  }
}

function yrMo(annual: number) {
  return {
    year: annual,
    month: annual / 12,
  };
}

function formatYrMo(annual: number) {
  const { year, month } = yrMo(annual);
  return `${formatInr(year)}/yr · ${formatInr(month)}/mo`;
}

export function CostCompositionPanel({
  composition,
  title = "Where the money goes",
  subtitle = "Whole plant · manufacturing cost by head (year and month)",
  compare,
  breakups,
  machineNames,
  utilityDetail,
  overheadDetail,
  drillHrefPrefix = "/factory",
}: {
  composition: CostCompositionAnnual;
  title?: string;
  subtitle?: string;
  compare?: CostCompositionAnnual | null;
  breakups?: Record<string, MhrBreakup>;
  machineNames?: Record<string, string>;
  /** Optional extra rows when Utilities head is open (annual amounts). */
  utilityDetail?: { label: string; amount: number }[];
  /** Optional plant OH lines when Overhead head is open (annual amounts). */
  overheadDetail?: { label: string; amount: number }[];
  drillHrefPrefix?: string;
}) {
  const [open, setOpen] = useState<CompositionHeadKey | null>(null);
  const total = HEADS.reduce((s, h) => s + (composition[h.key] || 0), 0);
  const totalMo = total / 12;

  const machineRows = useMemo(() => {
    if (!breakups || !open) return [];
    return Object.values(breakups)
      .map((b) => ({
        id: b.machineId,
        name: machineNames?.[b.machineId] ?? b.machineId,
        amount: annualForHead(b, open),
      }))
      .filter((r) => r.amount > 0.5)
      .sort((a, b) => b.amount - a.amount);
  }, [breakups, machineNames, open]);

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-lowest p-5 sm:p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">
        Plant cost
      </p>
      <h3 className="mt-1 text-headline-sm text-on-surface">{title}</h3>
      <p className="mt-1 text-body-sm text-on-surface-variant">{subtitle}</p>
      <p className="mt-2 text-[11px] text-on-surface-variant">
        Tap a tile to see which machines drive it.
      </p>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="font-mono text-headline-lg tabular-nums text-on-surface">
          <AnimatedNumber
            value={total}
            format={(v) => formatInr(v)}
            className="tabular-nums"
          />
          <span className="ml-1 text-body-sm font-sans text-on-surface-variant">
            / year
          </span>
        </p>
        <p className="font-mono text-headline-sm tabular-nums text-on-surface-variant">
          <AnimatedNumber
            value={totalMo}
            format={(v) => formatInr(v)}
            className="tabular-nums"
          />
          <span className="ml-1 text-body-sm font-sans">/ month</span>
        </p>
      </div>

      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-sm bg-surface-high">
        {HEADS.map((h) => {
          const value = composition[h.key] || 0;
          const pct = total > 0 ? (value / total) * 100 : 0;
          if (pct < 0.4) return null;
          return (
            <div
              key={h.key}
              title={`${h.label}: ${formatYrMo(value)}`}
              className="h-full bg-primary/80 first:rounded-l-sm last:rounded-r-sm"
              style={{
                width: `${pct}%`,
                opacity: 0.45 + (pct / 100) * 0.55,
              }}
            />
          );
        })}
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {HEADS.map((h) => {
          const value = composition[h.key] || 0;
          const month = value / 12;
          const pct = total > 0 ? (value / total) * 100 : 0;
          const prev = compare?.[h.key];
          const delta = typeof prev === "number" ? value - prev : null;
          const isOpen = open === h.key;
          return (
            <li
              key={h.key}
              className={`rounded-lg border bg-surface ${
                isOpen
                  ? "border-primary/40 sm:col-span-2 xl:col-span-3"
                  : "border-outline-variant/70"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : h.key)}
                className="flex w-full items-start justify-between gap-3 p-3 text-left hover:bg-surface-low/80"
              >
                <div className="flex min-w-0 items-start gap-2">
                  {isOpen ? (
                    <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant" />
                  ) : (
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant" />
                  )}
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-on-surface">
                      {h.label}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      {h.hint}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-body-sm tabular-nums text-on-surface">
                    {formatInr(value)}
                    <span className="text-on-surface-variant">/yr</span>
                    <span className="ml-1 text-[11px] text-on-surface-variant">
                      {pct.toFixed(0)}%
                    </span>
                  </p>
                  <p className="font-mono text-[11px] tabular-nums text-on-surface-variant">
                    {formatInr(month)}/mo
                  </p>
                  {delta !== null && Math.abs(delta) >= 1 ? (
                    <p
                      className={`font-mono text-[11px] tabular-nums ${
                        delta > 0 ? "text-amber-700" : "text-primary"
                      }`}
                    >
                      {delta > 0 ? "+" : ""}
                      {formatInr(delta)}/yr · {delta > 0 ? "+" : ""}
                      {formatInr(delta / 12)}/mo vs live
                    </p>
                  ) : null}
                </div>
              </button>

              {isOpen ? (
                <div className="space-y-2 border-t border-outline-variant/60 px-3 py-2.5">
                  {h.key === "utility" && utilityDetail?.length ? (
                    <div className="space-y-1 border-b border-outline-variant/50 pb-2">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                        Utility mix
                      </p>
                      {utilityDetail.map((row) => (
                        <div
                          key={row.label}
                          className="flex justify-between gap-2 text-body-sm"
                        >
                          <span className="text-on-surface-variant">
                            {row.label}
                          </span>
                          <span className="font-mono tabular-nums text-right">
                            {formatYrMo(row.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {h.key === "overhead" && overheadDetail?.length ? (
                    <div className="space-y-1 border-b border-outline-variant/50 pb-2">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                        Overhead lines (plant)
                      </p>
                      {overheadDetail.map((row) => (
                        <div
                          key={row.label}
                          className="flex justify-between gap-2 text-body-sm"
                        >
                          <span className="text-on-surface-variant">
                            {row.label}
                          </span>
                          <span className="font-mono tabular-nums text-right">
                            {formatYrMo(row.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                    By machine
                  </p>
                  {machineRows.length === 0 ? (
                    <p className="text-body-sm text-on-surface-variant">
                      No machine detail for this head yet.
                    </p>
                  ) : (
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {machineRows.map((row) => (
                        <div
                          key={row.id}
                          className="flex items-center justify-between gap-2 text-body-sm"
                        >
                          <Link
                            href={`${drillHrefPrefix}/${row.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {row.name}
                          </Link>
                          <span className="font-mono tabular-nums text-right text-on-surface">
                            {formatYrMo(row.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
