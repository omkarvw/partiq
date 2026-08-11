import { calcCost, toSeconds } from "@/lib/costing";
import {
  getAllParts,
  getAllQuotations,
  getCurrentVersion,
  getPart,
  getQuotation,
} from "@/lib/data";
import { isMarginExcepted } from "@/lib/commercial/entityStore";
import { resolvePlantMachineId } from "@/lib/plant/machineBridge";
import type {
  ImpactStep,
  MhrBreakup,
  PartEconomics,
  PlantKpis,
  QuoteEconomics,
} from "./types";

export type MachineRef = { id: string; type: string; name: string };

/** Resolve effective MHR for a process version (derived when machineId is set). */
export function resolveVersionMhr(
  versionMhr: number,
  machineId: string | undefined,
  breakups: Record<string, MhrBreakup>,
  plantMachines?: MachineRef[],
): number {
  const id = plantMachines
    ? resolvePlantMachineId(machineId, plantMachines)
    : machineId;
  if (id && breakups[id]) {
    return breakups[id].manufacturingMhr;
  }
  return versionMhr;
}

export function computePartEconomics(
  partId: string,
  breakups: Record<string, MhrBreakup>,
  plantMachines?: MachineRef[],
): PartEconomics | null {
  const part = getPart(partId);
  if (!part) return null;
  let estCost = 0;
  let actCost = 0;
  let estTimeSec = 0;
  let actTimeSec = 0;
  for (const proc of part.processes) {
    const v = getCurrentVersion(proc);
    const mhr = resolveVersionMhr(v.mhr, v.machineId, breakups, plantMachines);
    estCost += calcCost(mhr, v.timeEstimated, v.timeUnit);
    actCost += calcCost(mhr, v.timeActual, v.timeUnit);
    estTimeSec += toSeconds(v.timeEstimated, v.timeUnit);
    actTimeSec += toSeconds(v.timeActual, v.timeUnit);
  }
  return { partId, estCost, actCost, estTimeSec, actTimeSec };
}

export function computeQuoteEconomics(
  quotationId: string,
  breakups: Record<string, MhrBreakup>,
  plantMachines?: MachineRef[],
): QuoteEconomics | null {
  const q = getQuotation(quotationId);
  if (!q) return null;
  const partEco = computePartEconomics(q.partId, breakups, plantMachines);
  const costBasis = partEco?.estCost ?? q.costBasis ?? 0;
  const markupPct =
    costBasis > 0 ? ((q.unitPrice - costBasis) / costBasis) * 100 : null;
  const grossMarginPct =
    q.unitPrice > 0 ? ((q.unitPrice - costBasis) / q.unitPrice) * 100 : null;
  return {
    quotationId: q.id,
    partId: q.partId,
    unitPrice: q.unitPrice,
    costBasis,
    grossMarginPct,
    markupPct,
    underwater: costBasis > q.unitPrice,
  };
}

export function listAtRiskQuotes(
  breakups: Record<string, MhrBreakup>,
  marginFloorPct = 10,
  plantMachines?: MachineRef[],
): QuoteEconomics[] {
  return getAllQuotations()
    .map((q) => computeQuoteEconomics(q.id, breakups, plantMachines))
    .filter((e): e is QuoteEconomics => {
      if (!e) return false;
      if (e.underwater) return true;
      return e.grossMarginPct !== null && e.grossMarginPct < marginFloorPct;
    });
}

/** Worst (most underwater / lowest margin) quote economics for a part, if any. */
export function getPartQuoteRisk(
  partId: string,
  breakups: Record<string, MhrBreakup>,
  plantMachines?: MachineRef[],
): QuoteEconomics | null {
  const ecos = getAllQuotations()
    .filter(
      (q) =>
        q.partId === partId &&
        q.status !== "Inactive" &&
        q.status !== "Superseded",
    )
    .map((q) => computeQuoteEconomics(q.id, breakups, plantMachines))
    .filter((e): e is QuoteEconomics => e != null);
  if (ecos.length === 0) return null;
  const underwater = ecos.filter((e) => e.underwater);
  if (underwater.length > 0) {
    return underwater.reduce((a, b) =>
      (a.grossMarginPct ?? -Infinity) <= (b.grossMarginPct ?? -Infinity) ? a : b,
    );
  }
  return ecos.reduce((a, b) =>
    (a.grossMarginPct ?? 100) <= (b.grossMarginPct ?? 100) ? a : b,
  );
}

export type UrgentPartRow = {
  partId: string;
  code: string;
  name: string;
  customer: string;
  status: string;
  economics: QuoteEconomics;
  gapToGoalPts: number;
  reason: "underwater" | "below_goal";
};

/**
 * Parts whose live quote margin misses the plant target (or are underwater).
 * Goal comes from onboarding: plant.targetGrossMarginPct.
 */
export function listUrgentParts(
  breakups: Record<string, MhrBreakup>,
  targetGrossMarginPct: number,
  plantMachines?: MachineRef[],
): UrgentPartRow[] {
  const goal = Number.isFinite(targetGrossMarginPct)
    ? targetGrossMarginPct
    : 20;
  const rows: UrgentPartRow[] = [];
  for (const part of getAllParts()) {
    if (part.status === "Inactive") continue;
    const economics = getPartQuoteRisk(part.id, breakups, plantMachines);
    if (!economics || economics.grossMarginPct == null) continue;
    if (isMarginExcepted(economics.quotationId)) continue;
    const q = getQuotation(economics.quotationId);
    if (q?.status === "Inactive" || q?.status === "Superseded") continue;
    const belowGoal = economics.grossMarginPct < goal;
    if (!economics.underwater && !belowGoal) continue;
    rows.push({
      partId: part.id,
      code: part.code,
      name: part.name,
      customer: part.customer,
      status: part.status,
      economics,
      gapToGoalPts: goal - economics.grossMarginPct,
      reason: economics.underwater ? "underwater" : "below_goal",
    });
  }
  return rows.sort((a, b) => {
    if (a.reason !== b.reason) {
      return a.reason === "underwater" ? -1 : 1;
    }
    return b.gapToGoalPts - a.gapToGoalPts;
  });
}

/**
 * Decision profit: freeze selling rate at baseline.
 * Excel "desired profit %" markup rises when costs rise — that is NOT
 * what a founder means by impact. Here revenue/hr stays at baseline selling MHR.
 */
export function profitAtFixedSellingRate(
  baseline: MhrBreakup,
  current: MhrBreakup,
): number {
  const hours = current.productiveHoursYear;
  return baseline.sellingMhr * hours - current.manufacturingMhr * hours;
}

export function buildImpactCascade(
  baseline: {
    breakups: Record<string, MhrBreakup>;
    plant: PlantKpis;
  },
  current: {
    breakups: Record<string, MhrBreakup>;
    plant: PlantKpis;
  },
  machineId: string,
  samplePartId: string,
  sampleQuoteId: string,
): ImpactStep[] {
  const bM = baseline.breakups[machineId];
  const cM = current.breakups[machineId];
  const bPart = computePartEconomics(samplePartId, baseline.breakups);
  const cPart = computePartEconomics(samplePartId, current.breakups);
  const bQuote = computeQuoteEconomics(sampleQuoteId, baseline.breakups);
  const cQuote = computeQuoteEconomics(sampleQuoteId, current.breakups);

  const bProfit = profitAtFixedSellingRate(bM, bM);
  const cProfit = profitAtFixedSellingRate(bM, cM);

  const pct = (prev: number, next: number) => {
    if (!prev) return next === prev ? "—" : "new";
    const d = ((next - prev) / Math.abs(prev)) * 100;
    const sign = d > 0 ? "↑" : d < 0 ? "↓" : "→";
    return `${sign} ${Math.abs(d).toFixed(1)}%`;
  };

  const deltaInr = (prev: number, next: number, perHour = false) => {
    const d = next - prev;
    const sign = d > 0 ? "↑" : d < 0 ? "↓" : "→";
    const formatted = new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(Math.abs(d));
    return `${sign} ₹${formatted}${perHour ? "/hr" : ""}`;
  };

  const deltaPctPoints = (prev: number | null, next: number | null) => {
    if (prev === null || next === null) return "—";
    const d = next - prev;
    const sign = d > 0 ? "↑" : d < 0 ? "↓" : "→";
    return `${sign} ${Math.abs(d).toFixed(1)} pp`;
  };

  return [
    {
      id: "utility-hr",
      label: "Utility + Power / Hour",
      value: cM.utilityPerHour,
      previousValue: bM.utilityPerHour,
      unit: "₹/hr",
      deltaLabel: pct(bM.utilityPerHour, cM.utilityPerHour),
    },
    {
      id: "labour-hr",
      label: "Labour / Hour",
      value: cM.labourPerHour,
      previousValue: bM.labourPerHour,
      unit: "₹/hr",
      deltaLabel: pct(bM.labourPerHour, cM.labourPerHour),
    },
    {
      id: "manufacturing-mhr",
      label: "Manufacturing MHR (cost)",
      value: cM.manufacturingMhr,
      previousValue: bM.manufacturingMhr,
      unit: "₹/hr",
      deltaLabel: deltaInr(bM.manufacturingMhr, cM.manufacturingMhr, true),
    },
    {
      id: "part-cost",
      label: "MID-3060 process cost",
      value: cPart?.estCost ?? 0,
      previousValue: bPart?.estCost ?? 0,
      unit: "₹",
      deltaLabel: deltaInr(bPart?.estCost ?? 0, cPart?.estCost ?? 0),
    },
    {
      id: "quote-margin",
      label: "Sample quote gross margin",
      value: cQuote?.grossMarginPct ?? 0,
      previousValue: bQuote?.grossMarginPct ?? 0,
      unit: "%",
      deltaLabel: deltaPctPoints(
        bQuote?.grossMarginPct ?? null,
        cQuote?.grossMarginPct ?? null,
      ),
    },
    {
      id: "annual-profit",
      label: "Profit @ fixed selling rate",
      value: cProfit,
      previousValue: bProfit,
      unit: "₹",
      deltaLabel: deltaInr(bProfit, cProfit),
    },
  ];
}

export function allPartIds(): string[] {
  return getAllParts().map((p) => p.id);
}
