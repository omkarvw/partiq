import type {
  FactoryInputs,
  MachineInputs,
  PlantKpis,
} from "@/lib/factory/types";
import { computeAllMachines, computePlantKpis } from "@/lib/factory/calcEngine";
import {
  labourAnnualForMachine,
  overheadAnnualPerMachine,
  resolveToolingLines,
  toFactoryInputs,
  toolingAnnual,
  type V2ClientRecord,
  type V2MachineDraft,
  type V2PlantDraft,
  type V2ToolingLine,
} from "@/lib/v2/clientDb";

export function distinctTypes(machines: V2MachineDraft[]): string[] {
  return Array.from(new Set(machines.map((m) => m.type)));
}

/** Average machine footprint (sq ft) for each machine type present. */
export function avgFootprintByType(
  machines: V2MachineDraft[],
): Record<string, number> {
  const groups: Record<string, { total: number; count: number }> = {};
  for (const machine of machines) {
    const group = groups[machine.type] ?? { total: 0, count: 0 };
    group.total += machine.footprintSqFt;
    group.count += 1;
    groups[machine.type] = group;
  }
  const out: Record<string, number> = {};
  for (const [type, group] of Object.entries(groups)) {
    out[type] = group.count > 0 ? group.total / group.count : 0;
  }
  return out;
}

export function usedFloorSqFt(machines: V2MachineDraft[]): number {
  return machines.reduce((sum, machine) => sum + machine.footprintSqFt, 0);
}

/**
 * Remaining floor that can realistically host new machines, after subtracting
 * space already used and applying the plant's space-efficiency factor
 * (aisles, WIP, safety clearance).
 */
export function usableRemainingFloorSqFt(
  plant: V2PlantDraft,
  machines: V2MachineDraft[],
): number {
  const remaining = plant.shopFloorSqFt - usedFloorSqFt(machines);
  const efficiency = Math.max(0, Math.min(100, plant.spaceEfficiencyPct)) / 100;
  return Math.max(0, remaining * efficiency);
}

/**
 * How many more machines of each existing type could fit. These are
 * alternatives, not additive: they all draw from the same remaining floor.
 */
export function maxAdditionalByType(
  plant: V2PlantDraft,
  machines: V2MachineDraft[],
): Record<string, number> {
  const usable = usableRemainingFloorSqFt(plant, machines);
  const avg = avgFootprintByType(machines);
  const out: Record<string, number> = {};
  for (const type of distinctTypes(machines)) {
    const footprint = avg[type];
    out[type] = footprint > 0 ? Math.floor(usable / footprint) : 0;
  }
  return out;
}

/** Representative (averaged) machine of a type, used to synthesize additions. */
function avgMachineTemplate(
  machines: V2MachineDraft[],
  type: string,
): V2MachineDraft | null {
  const list = machines.filter((machine) => machine.type === type);
  if (list.length === 0) return null;
  const n = list.length;
  const avg = (select: (m: V2MachineDraft) => number) =>
    list.reduce((sum, machine) => sum + select(machine), 0) / n;
  return {
    ...list[0],
    id: `proj-${type}`,
    machineCost: avg((m) => m.machineCost),
    freight: avg((m) => m.freight),
    installation: avg((m) => m.installation),
    foundation: avg((m) => m.foundation),
    accessories: avg((m) => m.accessories),
    interestRatePct: avg((m) => m.interestRatePct),
    powerKw: avg((m) => m.powerKw),
    otherUtilityAnnual: avg((m) => m.otherUtilityAnnual),
    maintenanceAnnual: avg((m) => m.maintenanceAnnual),
    desiredProfitPct: avg((m) => m.desiredProfitPct),
    footprintSqFt: avg((m) => m.footprintSqFt),
    toolingOverride: null,
  };
}

function toInputs(
  machine: V2MachineDraft,
  labourAllocated: number,
  ohAllocated: number,
  toolingProfiles: Record<string, V2ToolingLine[]>,
): MachineInputs {
  return {
    id: machine.id,
    name: machine.name,
    type: machine.type || "Machine",
    status: "Running",
    machineCost: machine.machineCost,
    freight: machine.freight,
    installation: machine.installation,
    foundation: machine.foundation,
    accessories: machine.accessories,
    downPaymentPct: 0,
    interestRatePct: machine.interestRatePct,
    tenureYears: machine.tenureYears,
    lifeYears: machine.lifeYears,
    salvagePct: machine.salvagePct,
    powerKw: machine.powerKw,
    otherUtilityAnnual: machine.otherUtilityAnnual,
    labourAnnualAllocated: labourAllocated,
    toolingAnnual: toolingAnnual(resolveToolingLines(machine, toolingProfiles)),
    maintenanceAnnual: machine.maintenanceAnnual,
    factoryOhAnnual: ohAllocated,
    desiredProfitPct: machine.desiredProfitPct,
    footprintSqFt: machine.footprintSqFt,
    workingDaysPerMonth: machine.workingDaysPerMonth,
    workingDaysPerYear: machine.workingDaysPerYear,
    shiftsPerDay: machine.shiftsPerDay,
    hoursPerShift: machine.hoursPerShift,
    utilizationPct: machine.utilizationPct,
    performancePct: machine.performancePct,
    qualityPct: machine.qualityPct,
    plannedMaintHours: machine.plannedMaintHours,
    breakdownHours: machine.breakdownHours,
    setupHours: machine.setupHours,
  };
}

export type CapacityProjection = {
  type: string;
  additionalCount: number;
  currentMachineCount: number;
  projectedMachineCount: number;
  avgFootprint: number;
  usableRemainingSqFt: number;
  current: PlantKpis;
  projected: PlantKpis;
};

/**
 * Project blended MHR and annual profit if the plant filled its remaining floor
 * with additional machines of the given type, running at the assumed
 * utilization. Reuses the shared calc engine — no new costing logic.
 */
export function projectFleetAtCapacity(
  record: V2ClientRecord,
  type: string,
  assumedUtilizationPct: number,
): CapacityProjection {
  const currentCount = record.machines.length;
  const additionalCount =
    maxAdditionalByType(record.plant, record.machines)[type] ?? 0;
  const projectedCount = currentCount + additionalCount;

  const currentFactory = toFactoryInputs(record.plant, record);
  const currentOh = overheadAnnualPerMachine(record.overheadLines, currentCount);
  const currentInputs = record.machines.map((machine) =>
    toInputs(
      machine,
      labourAnnualForMachine(machine, record),
      currentOh,
      record.toolingProfiles,
    ),
  );
  const currentBreakups = computeAllMachines(currentFactory, currentInputs);
  const current = computePlantKpis(currentFactory, currentInputs, currentBreakups);

  const projectedFactory: FactoryInputs = {
    ...currentFactory,
    utilizationPct: assumedUtilizationPct,
  };
  const allocationCount = Math.max(1, projectedCount);
  const projectedOh = overheadAnnualPerMachine(
    record.overheadLines,
    allocationCount,
  );
  const template = avgMachineTemplate(record.machines, type);
  const extra: V2MachineDraft[] = [];
  if (template) {
    for (let i = 0; i < additionalCount; i += 1) {
      extra.push({
        ...template,
        id: `proj-${type}-${i}`,
        name: `${type} +${i + 1}`,
        utilizationPct: assumedUtilizationPct,
      });
    }
  }
  const projectedRecord: V2ClientRecord = {
    ...record,
    machines: [...record.machines, ...extra],
  };
  const projectedInputs = projectedRecord.machines.map((machine) =>
    toInputs(
      { ...machine, utilizationPct: assumedUtilizationPct },
      labourAnnualForMachine(machine, projectedRecord),
      projectedOh,
      record.toolingProfiles,
    ),
  );
  const projectedBreakups = computeAllMachines(
    projectedFactory,
    projectedInputs,
  );
  const projected = computePlantKpis(
    projectedFactory,
    projectedInputs,
    projectedBreakups,
  );

  return {
    type,
    additionalCount,
    currentMachineCount: currentCount,
    projectedMachineCount: projectedCount,
    avgFootprint: avgFootprintByType(record.machines)[type] ?? 0,
    usableRemainingSqFt: usableRemainingFloorSqFt(record.plant, record.machines),
    current,
    projected,
  };
}
