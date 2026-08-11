import type {
  FactoryInputs,
  MachineInputs,
  ScenarioDef,
} from "./types";

export const MACHINE_BROTHER = "mch-brother-vmc";
export const MACHINE_CNC = "mch-cnc-lathe";

/**
 * Golden seed from MHR Calculation Master Sheet (Brother VMC).
 * Annual allocations chosen so hourly heads match Excel at 2,448 productive hours
 * and ₹10/kWh baseline electricity (10 kW × ₹10 × 2448 = ₹2,44,800 → ₹100/hr).
 */
export const baselineFactory: FactoryInputs = {
  id: "fac-mumbai-west",
  name: "Mumbai West Plant",
  orgLabel: "ORG-992A-X",
  landSqFt: 18500,
  employeesDirect: 28,
  employeesIndirect: 14,
  electricityRatePerKwh: 10,
  workingDaysPerMonth: 20,
  workingDaysPerYear: 240,
  shiftsPerDay: 1,
  hoursPerShift: 12,
  utilizationPct: 85,
  availabilityPct: 100,
  performancePct: 95,
  qualityPct: 98,
  plannedMaintHours: 0,
  breakdownHours: 0,
  setupHours: 0,
};

export const baselineMachines: MachineInputs[] = [
  {
    id: MACHINE_BROTHER,
    name: "Brother VMC",
    type: "VMC",
    status: "Running",
    machineCost: 4_000_000,
    freight: 50_000,
    installation: 0,
    foundation: 50_000,
    accessories: 500_000,
    downPaymentPct: 0,
    interestRatePct: 8.5,
    tenureYears: 5,
    lifeYears: 10,
    salvagePct: 10,
    powerKw: 10,
    otherUtilityAnnual: 272_602.5,
    labourAnnualAllocated: 896_246.91,
    toolingAnnual: 1_160_000,
    maintenanceAnnual: 143_000,
    factoryOhAnnual: 379_440,
    desiredProfitPct: 40,
    footprintSqFt: 180,
    workingDaysPerMonth: 20,
    workingDaysPerYear: 240,
    shiftsPerDay: 1,
    hoursPerShift: 12,
    utilizationPct: 85,
    performancePct: 95,
    qualityPct: 98,
    plannedMaintHours: 0,
    breakdownHours: 0,
    setupHours: 0,
  },
  {
    id: MACHINE_CNC,
    name: "CNC Lathe 1",
    type: "CNC Lathe",
    status: "Running",
    machineCost: 2_200_000,
    freight: 30_000,
    installation: 40_000,
    foundation: 25_000,
    accessories: 150_000,
    downPaymentPct: 10,
    interestRatePct: 8.5,
    tenureYears: 5,
    lifeYears: 10,
    salvagePct: 10,
    powerKw: 7.5,
    otherUtilityAnnual: 120_000,
    labourAnnualAllocated: 520_000,
    toolingAnnual: 420_000,
    maintenanceAnnual: 85_000,
    factoryOhAnnual: 220_000,
    desiredProfitPct: 30,
    footprintSqFt: 120,
    workingDaysPerMonth: 20,
    workingDaysPerYear: 240,
    shiftsPerDay: 1,
    hoursPerShift: 12,
    utilizationPct: 85,
    performancePct: 95,
    qualityPct: 98,
    plannedMaintHours: 0,
    breakdownHours: 0,
    setupHours: 0,
  },
];

export const scenarios: ScenarioDef[] = [
  {
    id: "base",
    name: "Baseline",
    description: "Current factory as modelled — one shift, grid power, current salaries.",
    patches: {},
  },
  {
    id: "night",
    name: "Night Shift",
    description: "Add a second shift. Labour premium +25%, utilization 80%.",
    patches: {
      factory: {
        shiftsPerDay: 2,
        utilizationPct: 80,
      },
    },
    relativeMachineFactors: {
      [MACHINE_BROTHER]: { labourAnnualAllocated: 1.25 },
      [MACHINE_CNC]: { labourAnnualAllocated: 1.25 },
    },
  },
  {
    id: "solar",
    name: "Solar Installed",
    description: "Effective electricity tariff drops to ₹5/kWh after solar CapEx.",
    patches: {
      factory: {
        electricityRatePerKwh: 5,
      },
    },
  },
  {
    id: "salary",
    name: "Salary +15%",
    description: "Across-the-board labour cost increase including statutory load.",
    patches: {},
    relativeMachineFactors: {
      [MACHINE_BROTHER]: { labourAnnualAllocated: 1.15 },
      [MACHINE_CNC]: { labourAnnualAllocated: 1.15 },
    },
  },
  {
    id: "power-spike",
    name: "Power tariff ₹15",
    description: "Electricity jumps to ₹15/kWh (grid shock).",
    patches: {
      factory: { electricityRatePerKwh: 15 },
    },
  },
  {
    id: "low-util",
    name: "Under-utilized 60%",
    description: "Demand soft — utilization falls to 60%.",
    patches: {
      factory: { utilizationPct: 60 },
    },
  },
  {
    id: "rate-hike",
    name: "Interest 11%",
    description: "Loan refinance / rate hike to 11% p.a.",
    patches: {
      machines: {
        [MACHINE_BROTHER]: { interestRatePct: 11 },
        [MACHINE_CNC]: { interestRatePct: 11 },
      },
    },
  },
  {
    id: "tooling-cut",
    name: "Tooling −20%",
    description: "Better tool life / renegotiated inserts.",
    patches: {},
    relativeMachineFactors: {
      [MACHINE_BROTHER]: { toolingAnnual: 0.8 },
      [MACHINE_CNC]: { toolingAnnual: 0.8 },
    },
  },
];

export function getScenario(
  id: string,
  extras: ScenarioDef[] = [],
): ScenarioDef {
  const all = [...scenarios, ...extras];
  return all.find((s) => s.id === id) ?? scenarios[0];
}

/** Diff current working state vs baseline into a scenario patch. */
export function snapshotToPatch(
  factory: FactoryInputs,
  machines: MachineInputs[],
  referenceFactory: FactoryInputs = baselineFactory,
  referenceMachines: MachineInputs[] = baselineMachines,
): ScenarioDef["patches"] {
  const factoryPatch: Partial<FactoryInputs> = {};
  for (const key of Object.keys(referenceFactory) as (keyof FactoryInputs)[]) {
    if (factory[key] !== referenceFactory[key]) {
      Object.assign(factoryPatch, { [key]: factory[key] });
    }
  }

  const machinesPatch: Record<string, Partial<MachineInputs>> = {};
  for (const m of machines) {
    const base = referenceMachines.find((b) => b.id === m.id);
    if (!base) continue;
    const partial: Partial<MachineInputs> = {};
    for (const key of Object.keys(base) as (keyof MachineInputs)[]) {
      if (m[key] !== base[key]) {
        Object.assign(partial, { [key]: m[key] });
      }
    }
    if (Object.keys(partial).length > 0) {
      machinesPatch[m.id] = partial;
    }
  }

  return {
    factory:
      Object.keys(factoryPatch).length > 0 ? factoryPatch : undefined,
    machines:
      Object.keys(machinesPatch).length > 0 ? machinesPatch : undefined,
  };
}
