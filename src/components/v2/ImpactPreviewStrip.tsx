"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";
import { formatInr } from "@/lib/costing";
import type { ImpactSectionId } from "@/lib/v2/clientDb";
import type { MhrBreakup } from "@/lib/factory/types";

const HEAD_METRICS: {
  id: ImpactSectionId | "maintenance";
  dirtyKey: ImpactSectionId;
  label: string;
  pick: (b: MhrBreakup) => number;
  unit: "/hr";
}[] = [
  { id: "labour", dirtyKey: "labour", label: "Labour", pick: (b) => b.labourPerHour, unit: "/hr" },
  {
    id: "utilities",
    dirtyKey: "utilities",
    label: "Utility",
    pick: (b) => b.utilityPerHour,
    unit: "/hr",
  },
  {
    id: "tooling",
    dirtyKey: "tooling",
    label: "Tooling",
    pick: (b) => b.toolingPerHour,
    unit: "/hr",
  },
  {
    id: "overhead",
    dirtyKey: "overhead",
    label: "Factory OH",
    pick: (b) => b.ohPerHour,
    unit: "/hr",
  },
  {
    id: "machines",
    dirtyKey: "machines",
    label: "EMI",
    pick: (b) => b.emiPerHour,
    unit: "/hr",
  },
  {
    id: "maintenance",
    dirtyKey: "machines",
    label: "Maintenance",
    pick: (b) => b.maintenancePerHour,
    unit: "/hr",
  },
];

function primaryChangedHead(
  dirty: Record<ImpactSectionId, boolean>,
  live: MhrBreakup | null,
  draftB: MhrBreakup | null,
): (typeof HEAD_METRICS)[number] | null {
  const candidates = HEAD_METRICS.filter((h) => dirty[h.dirtyKey]);
  if (candidates.length === 0) {
    if (dirty.plant) {
      return null;
    }
    return null;
  }
  if (!live || !draftB) return candidates[0];
  return [...candidates].sort(
    (a, b) =>
      Math.abs(b.pick(draftB) - b.pick(live)) -
      Math.abs(a.pick(draftB) - a.pick(live)),
  )[0];
}

/** Compact cascade preview on every Impact cost-area screen. */
export function ImpactPreviewStrip() {
  const pathname = usePathname();
  const {
    isDirty,
    moneyDirty,
    moneyDirtyTotal,
    focusMachineId,
    draftBreakups,
    liveBreakups,
    draft,
  } = useImpactDraft();

  if (!isDirty || moneyDirtyTotal === 0) return null;

  const machine = draft.machines.find((m) => m.id === focusMachineId);
  const live = focusMachineId ? liveBreakups[focusMachineId] : null;
  const draftB = focusMachineId ? draftBreakups[focusMachineId] : null;
  const liveMhr = live?.manufacturingMhr ?? 0;
  const draftMhr = draftB?.manufacturingMhr ?? 0;
  const deltaMhr = draftMhr - liveMhr;

  // Section-only / org moves: MHR unchanged — don’t flash the amber strip
  if (Math.abs(deltaMhr) < 0.005 && moneyDirtyTotal === 0) return null;

  const head = primaryChangedHead(moneyDirty, live, draftB);
  const liveHead = live && head ? head.pick(live) : null;
  const draftHead = draftB && head ? head.pick(draftB) : null;
  const deltaHead =
    liveHead !== null && draftHead !== null ? draftHead - liveHead : 0;

  const onOverview = pathname === "/impact";

  function goFullImpact(e: React.MouseEvent) {
    if (!onOverview) return;
    e.preventDefault();
    document
      .getElementById("decision-cascade")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <div className="min-w-0">
        <p className="text-body-sm font-medium text-on-surface">
          {moneyDirtyTotal} cost area{moneyDirtyTotal === 1 ? "" : "s"} changed
          {machine ? ` · ${machine.name}` : ""}
        </p>
        <p className="mt-0.5 text-body-sm text-on-surface-variant">
          {head && liveHead !== null && draftHead !== null ? (
            <>
              {head.label}
              {head.unit} {formatInr(liveHead)} → {formatInr(draftHead)}
              {Math.abs(deltaHead) >= 0.01
                ? ` (${deltaHead > 0 ? "+" : ""}${formatInr(deltaHead)})`
                : ""}
              {" · "}
            </>
          ) : null}
          Cash MHR {formatInr(liveMhr)} → {formatInr(draftMhr)}
          {Math.abs(deltaMhr) >= 0.01
            ? ` (${deltaMhr > 0 ? "+" : ""}${formatInr(deltaMhr)})`
            : ""}
        </p>
      </div>
      <Link
        href="/impact#decision-cascade"
        onClick={goFullImpact}
        className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg bg-primary px-3 text-body-sm font-medium text-on-primary"
      >
        View full impact
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
