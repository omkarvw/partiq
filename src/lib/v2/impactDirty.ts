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

/** Machine cost/calendar fields excluding utility (owned by Utilities cost area). */
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

export function anyDirty(d: Record<ImpactSectionId, boolean>) {
  return Object.values(d).some(Boolean);
}

export function dirtyCount(d: Record<ImpactSectionId, boolean>) {
  return Object.values(d).filter(Boolean).length;
}
