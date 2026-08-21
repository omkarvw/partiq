import { calcCost, toSeconds } from "@/lib/costing";
import {
  getAllParts,
  getAllQuotations,
  getCurrentVersion,
  getEnquiry,
  getPart,
  getQuotation,
} from "@/lib/data";
import { isMarginExcepted } from "@/lib/commercial/entityStore";
import { resolvePartMaterialCost, findMaterialGrade } from "@/lib/commercial/materialCost";
import { resolvePlantMachineId } from "@/lib/plant/machineBridge";
import type { V2MaterialGrade } from "@/lib/v2/clientDb";
import type { Quotation } from "@/lib/types";
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
  materialGrades: V2MaterialGrade[] = [],
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
  const materialCost = resolvePartMaterialCost(part, materialGrades);
  return {
    partId,
    estCost,
    actCost,
    materialCost,
    totalCost: materialCost + estCost,
    estTimeSec,
    actTimeSec,
  };
}

export type PartCostDeltaRow = {
  partId: string;
  code: string;
  name: string;
  gradeName: string;
  liveMaterial: number;
  draftMaterial: number;
  liveTotal: number;
  draftTotal: number;
  delta: number;
};

/** Live vs draft part totals when material grade rates differ. */
export function listPartCostDeltas(
  breakups: Record<string, MhrBreakup>,
  plantMachines: MachineRef[] | undefined,
  liveGrades: V2MaterialGrade[],
  draftGrades: V2MaterialGrade[],
): PartCostDeltaRow[] {
  const rows: PartCostDeltaRow[] = [];
  for (const part of getAllParts()) {
    if (part.status === "Inactive") continue;
    const gradeId = part.materialCosting?.materialGradeId;
    if (!gradeId) continue;
    const liveEco = computePartEconomics(
      part.id,
      breakups,
      plantMachines,
      liveGrades,
    );
    const draftEco = computePartEconomics(
      part.id,
      breakups,
      plantMachines,
      draftGrades,
    );
    if (!liveEco || !draftEco) continue;
    const delta = draftEco.totalCost - liveEco.totalCost;
    if (Math.abs(delta) < 0.005) continue;
    const grade =
      findMaterialGrade(draftGrades, gradeId) ??
      findMaterialGrade(liveGrades, gradeId);
    rows.push({
      partId: part.id,
      code: part.code,
      name: part.name,
      gradeName: grade?.name ?? "Grade",
      liveMaterial: liveEco.materialCost,
      draftMaterial: draftEco.materialCost,
      liveTotal: liveEco.totalCost,
      draftTotal: draftEco.totalCost,
      delta,
    });
  }
  return rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}


export function computeQuoteEconomics(
  quotationId: string,
  breakups: Record<string, MhrBreakup>,
  plantMachines?: MachineRef[],
  materialGrades: V2MaterialGrade[] = [],
): QuoteEconomics | null {
  const q = getQuotation(quotationId);
  if (!q) return null;
  const partEco = computePartEconomics(
    q.partId,
    breakups,
    plantMachines,
    materialGrades,
  );
  const processCost = partEco?.estCost ?? 0;
  const materialCost = partEco?.materialCost ?? 0;
  const costBasis = partEco?.totalCost ?? q.costBasis ?? 0;
  const markupPct =
    costBasis > 0 ? ((q.unitPrice - costBasis) / costBasis) * 100 : null;
  const grossMarginPct =
    q.unitPrice > 0 ? ((q.unitPrice - costBasis) / q.unitPrice) * 100 : null;
  return {
    quotationId: q.id,
    partId: q.partId,
    unitPrice: q.unitPrice,
    costBasis,
    processCost,
    materialCost,
    grossMarginPct,
    markupPct,
    underwater: costBasis > q.unitPrice,
  };
}

export function listAtRiskQuotes(
  breakups: Record<string, MhrBreakup>,
  marginFloorPct = 10,
  plantMachines?: MachineRef[],
  materialGrades: V2MaterialGrade[] = [],
): QuoteEconomics[] {
  return getAllQuotations()
    .map((q) =>
      computeQuoteEconomics(q.id, breakups, plantMachines, materialGrades),
    )
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
  materialGrades: V2MaterialGrade[] = [],
): QuoteEconomics | null {
  const ecos = getAllQuotations()
    .filter(
      (q) =>
        q.partId === partId &&
        q.status !== "Inactive" &&
        q.status !== "Superseded",
    )
    .map((q) =>
      computeQuoteEconomics(q.id, breakups, plantMachines, materialGrades),
    )
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
  /** Buyer on this quote’s enquiry (not only the part’s primary customer). */
  customer: string;
  status: string;
  quoteNumber: string;
  quotationId: string;
  economics: QuoteEconomics;
  gapToGoalPts: number;
  reason: "underwater" | "below_goal";
};

/**
 * Latest active quote per (part, customer) that misses the plant margin goal
 * or is underwater. Older quotes for the same pair are ignored so Urgent
 * does not grow forever with history.
 * Goal comes from onboarding: plant.targetGrossMarginPct.
 */
export function listUrgentParts(
  breakups: Record<string, MhrBreakup>,
  targetGrossMarginPct: number,
  plantMachines?: MachineRef[],
  materialGrades: V2MaterialGrade[] = [],
): UrgentPartRow[] {
  const goal = Number.isFinite(targetGrossMarginPct)
    ? targetGrossMarginPct
    : 20;
  const partsById = new Map(getAllParts().map((p) => [p.id, p]));

  /** Latest Draft/Sent quote per part+customer (Inactive/Superseded skipped). */
  const latestByPair = new Map<
    string,
    { quote: Quotation; customerName: string }
  >();

  for (const q of getAllQuotations()) {
    if (q.status === "Inactive" || q.status === "Superseded") continue;
    const part = partsById.get(q.partId);
    if (!part || part.status === "Inactive") continue;

    const enquiry = getEnquiry(q.enquiryId);
    const customerId = enquiry?.customerId ?? part.customerId;
    const customerName = enquiry?.customer ?? part.customer;
    const key = `${q.partId}::${customerId}`;
    const prev = latestByPair.get(key);
    if (
      !prev ||
      q.createdAt > prev.quote.createdAt ||
      (q.createdAt === prev.quote.createdAt && q.id > prev.quote.id)
    ) {
      latestByPair.set(key, { quote: q, customerName });
    }
  }

  const rows: UrgentPartRow[] = [];
  for (const { quote: q, customerName } of latestByPair.values()) {
    if (isMarginExcepted(q.id)) continue;
    const part = partsById.get(q.partId);
    if (!part) continue;

    const economics = computeQuoteEconomics(
      q.id,
      breakups,
      plantMachines,
      materialGrades,
    );
    if (!economics || economics.grossMarginPct == null) continue;
    const belowGoal = economics.grossMarginPct < goal;
    if (!economics.underwater && !belowGoal) continue;

    rows.push({
      partId: part.id,
      code: part.code,
      name: part.name,
      customer: customerName,
      status: part.status,
      quoteNumber: q.quoteNumber,
      quotationId: q.id,
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
