import type {
  BaselineChange,
  BaselineVersion,
  FactoryInputs,
  MachineInputs,
} from "./types";

const FIELD_META: Record<string, { label: string; unit?: string }> = {
  electricityRatePerKwh: { label: "Electricity tariff", unit: "₹/kWh" },
  workingDaysPerMonth: { label: "Working days / month", unit: "days" },
  workingDaysPerYear: { label: "Working days / year", unit: "days" },
  shiftsPerDay: { label: "Shifts / day" },
  hoursPerShift: { label: "Hours / shift", unit: "hours" },
  utilizationPct: { label: "Utilization", unit: "%" },
  availabilityPct: { label: "Availability", unit: "%" },
  performancePct: { label: "Performance", unit: "%" },
  qualityPct: { label: "Quality", unit: "%" },
  plannedMaintHours: { label: "Planned maintenance", unit: "hours" },
  breakdownHours: { label: "Breakdown time", unit: "hours" },
  setupHours: { label: "Setup time", unit: "hours" },
  machineCost: { label: "Machine cost", unit: "₹" },
  freight: { label: "Freight", unit: "₹" },
  installation: { label: "Installation", unit: "₹" },
  foundation: { label: "Foundation", unit: "₹" },
  accessories: { label: "Accessories", unit: "₹" },
  downPaymentPct: { label: "Down payment", unit: "%" },
  interestRatePct: { label: "Interest rate", unit: "%" },
  tenureYears: { label: "Loan tenure", unit: "years" },
  lifeYears: { label: "Machine life", unit: "years" },
  salvagePct: { label: "Salvage value", unit: "%" },
  powerKw: { label: "Connected load", unit: "kW" },
  otherUtilityAnnual: { label: "Other utilities / year", unit: "₹" },
  labourAnnualAllocated: { label: "Allocated labour / year", unit: "₹" },
  toolingAnnual: { label: "Tooling / year", unit: "₹" },
  maintenanceAnnual: { label: "Maintenance / year", unit: "₹" },
  factoryOhAnnual: { label: "Factory overhead / year", unit: "₹" },
  desiredProfitPct: { label: "Desired profit", unit: "%" },
  footprintSqFt: { label: "Machine footprint", unit: "sq ft" },
};

function readableField(field: string) {
  return field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}

function valuesDiffer(
  previousValue: FactoryInputs[keyof FactoryInputs] | MachineInputs[keyof MachineInputs],
  nextValue: FactoryInputs[keyof FactoryInputs] | MachineInputs[keyof MachineInputs],
) {
  return previousValue !== nextValue;
}

export function buildBaselineChanges(
  previousFactory: FactoryInputs,
  previousMachines: MachineInputs[],
  nextFactory: FactoryInputs,
  nextMachines: MachineInputs[],
): BaselineChange[] {
  const changes: BaselineChange[] = [];

  for (const field of Object.keys(previousFactory) as (keyof FactoryInputs)[]) {
    const previousValue = previousFactory[field];
    const nextValue = nextFactory[field];
    if (!valuesDiffer(previousValue, nextValue)) continue;
    const meta = FIELD_META[field] ?? { label: readableField(field) };
    changes.push({
      id: `factory-${field}`,
      scope: "factory",
      entityId: previousFactory.id,
      entityName: previousFactory.name,
      field,
      label: meta.label,
      previousValue,
      nextValue,
      unit: meta.unit,
    });
  }

  for (const nextMachine of nextMachines) {
    const previousMachine = previousMachines.find(
      (machine) => machine.id === nextMachine.id,
    );
    if (!previousMachine) continue;

    for (const field of Object.keys(previousMachine) as (keyof MachineInputs)[]) {
      const previousValue = previousMachine[field];
      const nextValue = nextMachine[field];
      if (!valuesDiffer(previousValue, nextValue)) continue;
      const meta = FIELD_META[field] ?? { label: readableField(field) };
      changes.push({
        id: `${nextMachine.id}-${field}`,
        scope: "machine",
        entityId: nextMachine.id,
        entityName: nextMachine.name,
        field,
        label: meta.label,
        previousValue,
        nextValue,
        unit: meta.unit,
      });
    }
  }

  return changes;
}

export function createInitialBaseline(
  factory: FactoryInputs,
  machines: MachineInputs[],
): BaselineVersion {
  return {
    id: "baseline-initial",
    name: "Initial operating baseline",
    note: "Seeded from the MHR Calculation Master Sheet.",
    createdAt: "2026-07-25T00:00:00.000Z",
    factory: { ...factory },
    machines: machines.map((machine) => ({ ...machine })),
    changes: [],
  };
}
