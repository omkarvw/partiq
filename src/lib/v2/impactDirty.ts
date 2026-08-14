import type {
  ImpactSectionId,
  V2BaselineSnapshot,
  V2MachineDraft,
} from "@/lib/v2/clientDb";

function stableStringify(value: unknown): string {
  return JSON.stringify(value);
}

/** Utility-owned machine fields — feed Cash MHR utility head, not “Machines” chrome. */
function utilityMachineSlice(machines: V2MachineDraft[]) {
  return machines.map((m) => ({
    id: m.id,
    powerKw: m.powerKw,
    utilityLines: m.utilityLines,
    otherUtilityAnnual: m.otherUtilityAnnual,
  }));
}

/**
 * Org-only fields: change Factory Pulse grouping / labels, not Cash MHR.
 * Excluded from yellow “cost area” dirty lights.
 */
const NON_MONEY_MACHINE_KEYS = new Set([
  "sectionId",
  "name",
  "footprintSqFt",
]);

/** Machine cost/calendar fields excluding utility + org chrome. */
function machinesMoneyWithoutUtility(machines: V2MachineDraft[]) {
  return machines.map((m) =>
    Object.fromEntries(
      Object.entries(m).filter(
        ([key]) =>
          key !== "powerKw" &&
          key !== "utilityLines" &&
          key !== "otherUtilityAnnual" &&
          !NON_MONEY_MACHINE_KEYS.has(key),
      ),
    ),
  );
}

/** Full machine slice including section assignment (for commit / discard). */
function machinesWithoutUtility(machines: V2MachineDraft[]) {
  return machines.map((m) =>
    Object.fromEntries(
      Object.entries(m).filter(
        ([key]) =>
          key !== "powerKw" &&
          key !== "utilityLines" &&
          key !== "otherUtilityAnnual",
      ),
    ),
  );
}

export function sectionSlices(snap: V2BaselineSnapshot) {
  return {
    plant: {
      name: snap.plant.name,
      orgLabel: snap.plant.orgLabel,
      city: snap.plant.city,
      targetGrossMarginPct: snap.plant.targetGrossMarginPct,
      sectionOrganizingHint: snap.plant.sectionOrganizingHint,
    },
    utilities: {
      electricityRatePerKwh: snap.plant.electricityRatePerKwh,
      perMachine: utilityMachineSlice(snap.machines),
    },
    machines: {
      machines: machinesWithoutUtility(snap.machines),
      sections: snap.sections,
    },
    labour: {
      labourByType: snap.labourByType,
      statutory: snap.statutory,
    },
    overhead: snap.overheadLines,
    tooling: snap.toolingProfiles,
  };
}

/** Cost-affecting slices only — section moves / renames do not light yellow. */
export function moneySectionSlices(snap: V2BaselineSnapshot) {
  return {
    plant: {
      // Margin can affect commercial urgency, not Cash MHR — keep plant money light soft
      electricityRatePerKwh: snap.plant.electricityRatePerKwh,
    },
    utilities: {
      electricityRatePerKwh: snap.plant.electricityRatePerKwh,
      perMachine: utilityMachineSlice(snap.machines),
    },
    machines: {
      machines: machinesMoneyWithoutUtility(snap.machines),
    },
    labour: {
      labourByType: snap.labourByType,
      statutory: snap.statutory,
    },
    overhead: snap.overheadLines,
    tooling: snap.toolingProfiles,
  };
}

export function dirtySections(
  baseline: V2BaselineSnapshot,
  draft: V2BaselineSnapshot,
): Record<ImpactSectionId, boolean> {
  const a = sectionSlices(baseline);
  const b = sectionSlices(draft);
  return {
    plant: stableStringify(a.plant) !== stableStringify(b.plant),
    utilities: stableStringify(a.utilities) !== stableStringify(b.utilities),
    machines: stableStringify(a.machines) !== stableStringify(b.machines),
    labour: stableStringify(a.labour) !== stableStringify(b.labour),
    overhead: stableStringify(a.overhead) !== stableStringify(b.overhead),
    tooling: stableStringify(a.tooling) !== stableStringify(b.tooling),
  };
}

/** Yellow indicators / “cost area changed” — only when ₹/hr inputs move. */
export function moneyDirtySections(
  baseline: V2BaselineSnapshot,
  draft: V2BaselineSnapshot,
): Record<ImpactSectionId, boolean> {
  const a = moneySectionSlices(baseline);
  const b = moneySectionSlices(draft);
  return {
    plant: false,
    utilities: stableStringify(a.utilities) !== stableStringify(b.utilities),
    machines: stableStringify(a.machines) !== stableStringify(b.machines),
    labour: stableStringify(a.labour) !== stableStringify(b.labour),
    overhead: stableStringify(a.overhead) !== stableStringify(b.overhead),
    tooling: stableStringify(a.tooling) !== stableStringify(b.tooling),
  };
}

export function anyDirty(d: Record<ImpactSectionId, boolean>) {
  return Object.values(d).some(Boolean);
}

export function dirtyCount(d: Record<ImpactSectionId, boolean>) {
  return Object.values(d).filter(Boolean).length;
}

const CALENDAR_KEYS = [
  "workingDaysPerMonth",
  "workingDaysPerYear",
  "shiftsPerDay",
  "hoursPerShift",
  "utilizationPct",
  "performancePct",
  "qualityPct",
  "plannedMaintHours",
  "breakdownHours",
  "setupHours",
] as const;

const EMI_KEYS = [
  "machineCost",
  "freight",
  "installation",
  "foundation",
  "accessories",
  "interestRatePct",
  "tenureYears",
  "lifeYears",
  "salvagePct",
  "desiredProfitPct",
] as const;

const MAINT_KEYS = [
  "maintenanceAmcAnnual",
  "maintenancePmAnnual",
  "maintenanceSparesAnnual",
  "maintenanceAnnual",
] as const;

function machineKeysChanged(
  baseline: V2BaselineSnapshot,
  draft: V2BaselineSnapshot,
  machineId: string,
  keys: readonly string[],
) {
  const a = baseline.machines.find((m) => m.id === machineId);
  const b = draft.machines.find((m) => m.id === machineId);
  if (!a || !b) return Boolean(b) !== Boolean(a);
  return keys.some(
    (k) =>
      stableStringify((a as Record<string, unknown>)[k]) !==
      stableStringify((b as Record<string, unknown>)[k]),
  );
}

/** Per-tab yellow dots on Impact → Machines. */
export function machineTabMoneyDirty(
  baseline: V2BaselineSnapshot,
  draft: V2BaselineSnapshot,
  machineId: string | null,
  tab: "calendar" | "emi" | "labour" | "utility" | "maintenance",
): boolean {
  if (tab === "labour") {
    return moneyDirtySections(baseline, draft).labour;
  }
  if (tab === "utility") {
    return moneyDirtySections(baseline, draft).utilities;
  }
  if (!machineId) return false;
  if (tab === "calendar") {
    return machineKeysChanged(baseline, draft, machineId, CALENDAR_KEYS);
  }
  if (tab === "emi") {
    return machineKeysChanged(baseline, draft, machineId, EMI_KEYS);
  }
  return machineKeysChanged(baseline, draft, machineId, MAINT_KEYS);
}
