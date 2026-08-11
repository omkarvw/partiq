import {
  computeAllMachines,
  computePlantKpis,
} from "@/lib/factory/calcEngine";
import type { MhrBreakup } from "@/lib/factory/types";
import {
  IMPACT_SECTIONS,
  clientRecordFromSnapshot,
  toFactoryInputs,
  toMachineInputs,
  type ImpactSectionId,
  type V2BaselineSnapshot,
  type V2LabourRole,
  type V2OhLine,
} from "@/lib/v2/clientDb";
import { buildMachineCascade } from "@/lib/v2/impactCascade";
import { dirtySections, dirtyCount } from "@/lib/v2/impactDirty";
import { formatInr } from "@/lib/costing";

export type SnapshotChangeLine = {
  section: ImpactSectionId;
  label: string;
};

export type SnapshotCompareResult = {
  changedSections: ImpactSectionId[];
  changeLines: SnapshotChangeLine[];
  sectionCount: number;
  /** Focus machine used for cascade (first shared id, else first in target). */
  focusMachineId: string | null;
  focusMachineName: string | null;
  referenceBreakup: MhrBreakup | null;
  targetBreakup: MhrBreakup | null;
  cascade: ReturnType<typeof buildMachineCascade>;
  referenceBlendedMhr: number;
  targetBlendedMhr: number;
  referenceCapacityHours: number;
  targetCapacityHours: number;
};

function rolePayLabel(role: V2LabourRole) {
  if (role.payBasis === "monthly") {
    return `${formatInr(role.monthlySalary)}/mo`;
  }
  return `${formatInr(role.dayRateFor8h)}/day (8h)`;
}

function ohAnnual(line: V2OhLine) {
  if (line.kind === "people") return line.headcount * line.salaryPerMonth * 12;
  if (line.kind === "rent") return line.areaSqFt * line.rentPerSqFtMonth * 12;
  return line.amountAnnual;
}

/** Human-readable field diffs between reference → target snapshots. */
export function describeSnapshotChanges(
  reference: V2BaselineSnapshot,
  target: V2BaselineSnapshot,
): SnapshotChangeLine[] {
  const dirty = dirtySections(reference, target);
  const lines: SnapshotChangeLine[] = [];

  if (dirty.plant) {
    if (reference.plant.name !== target.plant.name) {
      lines.push({
        section: "plant",
        label: `Plant name: “${reference.plant.name}” → “${target.plant.name}”`,
      });
    }
    if (reference.plant.city !== target.plant.city) {
      lines.push({
        section: "plant",
        label: `City: ${reference.plant.city || "—"} → ${target.plant.city || "—"}`,
      });
    }
    if (reference.plant.orgLabel !== target.plant.orgLabel) {
      lines.push({
        section: "plant",
        label: `Org: ${reference.plant.orgLabel || "—"} → ${target.plant.orgLabel || "—"}`,
      });
    }
  }

  if (dirty.utilities) {
    lines.push({
      section: "utilities",
      label: `Tariff: ₹${reference.plant.electricityRatePerKwh}/kWh → ₹${target.plant.electricityRatePerKwh}/kWh`,
    });
  }

  if (dirty.labour) {
    const types = Array.from(
      new Set([
        ...Object.keys(reference.labourByType),
        ...Object.keys(target.labourByType),
      ]),
    );
    for (const type of types) {
      const a = reference.labourByType[type] ?? [];
      const b = target.labourByType[type] ?? [];
      const byName = new Map(a.map((r) => [r.name, r]));
      for (const role of b) {
        const prev = byName.get(role.name);
        if (!prev) {
          lines.push({
            section: "labour",
            label: `${type} · added ${role.name} (${rolePayLabel(role)})`,
          });
          continue;
        }
        const prevPay = rolePayLabel(prev);
        const nextPay = rolePayLabel(role);
        if (prevPay !== nextPay) {
          lines.push({
            section: "labour",
            label: `${type} · ${role.name}: ${prevPay} → ${nextPay}`,
          });
        }
        if (prev.machinesPerHead !== role.machinesPerHead) {
          lines.push({
            section: "labour",
            label: `${type} · ${role.name} machines/head: ${prev.machinesPerHead} → ${role.machinesPerHead}`,
          });
        }
      }
      for (const role of a) {
        if (!b.some((r) => r.name === role.name)) {
          lines.push({
            section: "labour",
            label: `${type} · removed ${role.name}`,
          });
        }
      }
    }
    const sA = reference.statutory;
    const sB = target.statutory;
    (["pfPct", "esicPct", "bonusPct", "gratuityPct", "leaveReservePct"] as const).forEach(
      (key) => {
        if (sA[key] !== sB[key]) {
          lines.push({
            section: "labour",
            label: `Statutory ${key.replace("Pct", "")}: ${sA[key]}% → ${sB[key]}%`,
          });
        }
      },
    );
  }

  if (dirty.overhead) {
    const aMap = new Map(reference.overheadLines.map((l) => [l.name, l]));
    for (const line of target.overheadLines) {
      const prev = aMap.get(line.name);
      if (!prev) {
        lines.push({
          section: "overhead",
          label: `Added OH “${line.name}” (${formatInr(ohAnnual(line))}/yr)`,
        });
        continue;
      }
      if (line.kind === "people") {
        if (
          prev.salaryPerMonth !== line.salaryPerMonth ||
          prev.headcount !== line.headcount
        ) {
          lines.push({
            section: "overhead",
            label: `${line.name}: ${prev.headcount}×${formatInr(prev.salaryPerMonth)}/mo → ${line.headcount}×${formatInr(line.salaryPerMonth)}/mo`,
          });
        }
      } else if (ohAnnual(prev) !== ohAnnual(line)) {
        lines.push({
          section: "overhead",
          label: `${line.name}: ${formatInr(ohAnnual(prev))}/yr → ${formatInr(ohAnnual(line))}/yr`,
        });
      }
    }
    for (const line of reference.overheadLines) {
      if (!target.overheadLines.some((l) => l.name === line.name)) {
        lines.push({
          section: "overhead",
          label: `Removed OH “${line.name}”`,
        });
      }
    }
  }

  if (dirty.tooling) {
    const types = Array.from(
      new Set([
        ...Object.keys(reference.toolingProfiles),
        ...Object.keys(target.toolingProfiles),
      ]),
    );
    for (const type of types) {
      const aSum = (reference.toolingProfiles[type] ?? []).reduce(
        (s, l) => s + l.amountAnnual,
        0,
      );
      const bSum = (target.toolingProfiles[type] ?? []).reduce(
        (s, l) => s + l.amountAnnual,
        0,
      );
      if (aSum !== bSum) {
        lines.push({
          section: "tooling",
          label: `${type} tooling: ${formatInr(aSum)}/yr → ${formatInr(bSum)}/yr`,
        });
      }
    }
  }

  if (dirty.machines) {
    if (reference.machines.length !== target.machines.length) {
      lines.push({
        section: "machines",
        label: `Machine count: ${reference.machines.length} → ${target.machines.length}`,
      });
    }
    const aById = new Map(reference.machines.map((m) => [m.id, m]));
    let machineFieldHits = 0;
    for (const m of target.machines) {
      const prev = aById.get(m.id);
      if (!prev) {
        lines.push({
          section: "machines",
          label: `Added machine “${m.name}” (${m.type})`,
        });
        continue;
      }
      const checks: [string, number | string, number | string][] = [
        ["util %", prev.utilizationPct, m.utilizationPct],
        ["power kW", prev.powerKw, m.powerKw],
        ["interest %", prev.interestRatePct, m.interestRatePct],
        ["maint ₹/yr", prev.maintenanceAnnual, m.maintenanceAnnual],
        ["machine cost", prev.machineCost, m.machineCost],
      ];
      for (const [label, a, b] of checks) {
        if (a !== b && machineFieldHits < 8) {
          lines.push({
            section: "machines",
            label: `${m.name}: ${label} ${a} → ${b}`,
          });
          machineFieldHits += 1;
        }
      }
    }
    if (machineFieldHits >= 8) {
      lines.push({
        section: "machines",
        label: "…more machine field changes (open in Impact for full detail)",
      });
    }
  }

  // Fallback if section dirty but no specific lines (stringify-only delta)
  for (const section of IMPACT_SECTIONS) {
    if (
      dirty[section.id] &&
      !lines.some((l) => l.section === section.id)
    ) {
      lines.push({
        section: section.id,
        label: `${section.label} assumptions changed`,
      });
    }
  }
  if (dirty.labour && !lines.some((l) => l.section === "labour")) {
    lines.push({
      section: "labour",
      label: "Labour assumptions changed",
    });
  }

  return lines;
}

function breakupsFor(snap: V2BaselineSnapshot) {
  const record = clientRecordFromSnapshot(snap);
  const factory = toFactoryInputs(record.plant, record);
  const machines = toMachineInputs(record);
  const breakups = computeAllMachines(factory, machines);
  const kpis = computePlantKpis(factory, machines, breakups);
  return { breakups, kpis };
}

/** Compare reference → target: section diffs + Cash MHR cascade. */
export function compareSnapshots(
  reference: V2BaselineSnapshot,
  target: V2BaselineSnapshot,
): SnapshotCompareResult {
  const dirty = dirtySections(reference, target);
  const changedSections = (
    [
      ...IMPACT_SECTIONS.map((s) => s.id),
      ...(dirty.labour ? (["labour"] as const) : []),
    ] as ImpactSectionId[]
  ).filter((id, i, arr) => dirty[id] && arr.indexOf(id) === i);
  const changeLines = describeSnapshotChanges(reference, target);

  let referenceBreakups: Record<string, MhrBreakup> = {};
  let targetBreakups: Record<string, MhrBreakup> = {};
  let referenceBlendedMhr = 0;
  let targetBlendedMhr = 0;
  let referenceCapacityHours = 0;
  let targetCapacityHours = 0;

  try {
    const ref = breakupsFor(reference);
    const tgt = breakupsFor(target);
    referenceBreakups = ref.breakups;
    targetBreakups = tgt.breakups;
    referenceBlendedMhr = ref.kpis.blendedMhr;
    targetBlendedMhr = tgt.kpis.blendedMhr;
    referenceCapacityHours = ref.kpis.capacityHours;
    targetCapacityHours = tgt.kpis.capacityHours;
  } catch {
    // leave zeros
  }

  const sharedId =
    target.machines.find((m) => referenceBreakups[m.id] && targetBreakups[m.id])
      ?.id ??
    target.machines[0]?.id ??
    null;
  const focusMachine = target.machines.find((m) => m.id === sharedId) ?? null;
  const referenceBreakup = sharedId ? referenceBreakups[sharedId] ?? null : null;
  const targetBreakup = sharedId ? targetBreakups[sharedId] ?? null : null;
  const cascade =
    referenceBreakup && targetBreakup
      ? buildMachineCascade(referenceBreakup, targetBreakup)
      : [];

  return {
    changedSections,
    changeLines,
    sectionCount: dirtyCount(dirty),
    focusMachineId: sharedId,
    focusMachineName: focusMachine?.name ?? null,
    referenceBreakup,
    targetBreakup,
    cascade,
    referenceBlendedMhr,
    targetBlendedMhr,
    referenceCapacityHours,
    targetCapacityHours,
  };
}

export function sectionLabel(id: ImpactSectionId) {
  if (id === "labour") return "Labour";
  return IMPACT_SECTIONS.find((s) => s.id === id)?.label ?? id;
}
