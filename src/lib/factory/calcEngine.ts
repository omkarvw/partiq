import type {
  CalendarResult,
  FactoryInputs,
  MachineInputs,
  MhrBreakup,
  PlantKpis,
  ScenarioDef,
} from "./types";

/** Standard loan PMT (payment). Returns positive installment for a positive principal. */
export function pmt(
  monthlyRate: number,
  nPer: number,
  presentValue: number,
): number {
  if (nPer <= 0) return 0;
  if (monthlyRate === 0) return presentValue / nPer;
  const factor = Math.pow(1 + monthlyRate, nPer);
  return (presentValue * monthlyRate * factor) / (factor - 1);
}

export function totalInvestment(m: MachineInputs): number {
  return (
    m.machineCost +
    m.freight +
    m.installation +
    m.foundation +
    m.accessories
  );
}

/** Calendar slice used by productive-hour math (machine-first; factory for V1 fallback). */
export type CalendarSource = {
  workingDaysPerMonth: number;
  workingDaysPerYear: number;
  shiftsPerDay: number;
  hoursPerShift: number;
  utilizationPct: number;
  performancePct: number;
  qualityPct: number;
  plannedMaintHours: number;
  breakdownHours: number;
  setupHours: number;
};

export function computeCalendar(c: CalendarSource): CalendarResult {
  const availableHoursYear =
    c.workingDaysPerYear * c.shiftsPerDay * c.hoursPerShift;
  const netAvailableHours =
    availableHoursYear -
    c.plannedMaintHours -
    c.breakdownHours -
    c.setupHours;
  const availabilityPct =
    availableHoursYear > 0
      ? (netAvailableHours / availableHoursYear) * 100
      : 0;
  const oeePct =
    (availabilityPct * c.performancePct * c.qualityPct) / 10000;
  const productiveHoursYear = (netAvailableHours * c.utilizationPct) / 100;
  const productiveHoursMonth = productiveHoursYear / 12;
  const productiveHoursDay =
    c.workingDaysPerYear > 0
      ? productiveHoursYear / c.workingDaysPerYear
      : 0;

  return {
    availableHoursYear,
    netAvailableHours,
    oeePct,
    productiveHoursYear,
    productiveHoursMonth,
    productiveHoursDay,
  };
}

/** Prefer machine calendar; fall back to factory for legacy V1 seeds. */
export function resolveMachineCalendar(
  factory: FactoryInputs,
  machine: MachineInputs,
): CalendarSource {
  return {
    workingDaysPerMonth:
      machine.workingDaysPerMonth ?? factory.workingDaysPerMonth,
    workingDaysPerYear:
      machine.workingDaysPerYear ?? factory.workingDaysPerYear,
    shiftsPerDay: machine.shiftsPerDay ?? factory.shiftsPerDay,
    hoursPerShift: machine.hoursPerShift ?? factory.hoursPerShift,
    utilizationPct: machine.utilizationPct ?? factory.utilizationPct,
    performancePct: machine.performancePct ?? factory.performancePct,
    qualityPct: machine.qualityPct ?? factory.qualityPct,
    plannedMaintHours:
      machine.plannedMaintHours ?? factory.plannedMaintHours,
    breakdownHours: machine.breakdownHours ?? factory.breakdownHours,
    setupHours: machine.setupHours ?? factory.setupHours,
  };
}

export function computeMachine(
  factory: FactoryInputs,
  machine: MachineInputs,
): MhrBreakup {
  const calSrc = resolveMachineCalendar(factory, machine);
  const calendar = computeCalendar(calSrc);
  const investment = totalInvestment(machine);
  const downPayment = (investment * machine.downPaymentPct) / 100;
  const loanAmount = investment - downPayment;
  const monthlyRate = machine.interestRatePct / 12 / 100;
  const nPer = machine.tenureYears * 12;
  const monthlyEmi = pmt(monthlyRate, nPer, loanAmount);
  const annualEmi = monthlyEmi * 12;

  // Excel: Average EMI per Day = MonthlyEMI / WorkingDaysPerMonth
  //        Average EMI per Hour = EMI per Day / ProductiveHoursPerDay
  const emiPerDay =
    calSrc.workingDaysPerMonth > 0
      ? monthlyEmi / calSrc.workingDaysPerMonth
      : 0;
  const emiPerHour =
    calendar.productiveHoursDay > 0
      ? emiPerDay / calendar.productiveHoursDay
      : 0;

  const salvage = (investment * machine.salvagePct) / 100;
  const annualDepreciation =
    machine.lifeYears > 0
      ? (investment - salvage) / machine.lifeYears
      : 0;
  // Excel SLM Depreciation / Hour uses Available Hours, not productive hours
  const depreciationPerHour =
    calendar.availableHoursYear > 0
      ? annualDepreciation / calendar.availableHoursYear
      : 0;

  const hours = calendar.productiveHoursYear;
  const labourPerHour = hours > 0 ? machine.labourAnnualAllocated / hours : 0;
  const electricityAnnual =
    machine.powerKw * factory.electricityRatePerKwh * hours;
  const electricityPerHour = hours > 0 ? electricityAnnual / hours : 0;
  const otherUtilityPerHour =
    hours > 0 ? machine.otherUtilityAnnual / hours : 0;
  const utilityPerHour = electricityPerHour + otherUtilityPerHour;
  const maintenancePerHour =
    hours > 0 ? machine.maintenanceAnnual / hours : 0;
  const ohPerHour = hours > 0 ? machine.factoryOhAnnual / hours : 0;
  const toolingPerHour = hours > 0 ? machine.toolingAnnual / hours : 0;

  // Excel Total Manufacturing Cost = EMI + Labour + Utility + Maint + OH + Tooling (excl. dep)
  const manufacturingMhr =
    emiPerHour +
    labourPerHour +
    utilityPerHour +
    maintenancePerHour +
    ohPerHour +
    toolingPerHour;
  const fullAbsorptionMhr = manufacturingMhr + depreciationPerHour;
  const profitPerHour =
    (manufacturingMhr * machine.desiredProfitPct) / 100;
  const sellingMhr = manufacturingMhr + profitPerHour;
  const annualMfgCost = manufacturingMhr * hours;
  const annualRevenue = sellingMhr * hours;
  const annualProfit = annualRevenue - annualMfgCost;

  return {
    machineId: machine.id,
    totalInvestment: investment,
    loanAmount,
    monthlyEmi,
    annualEmi,
    emiPerHour,
    annualDepreciation,
    depreciationPerHour,
    labourPerHour,
    electricityPerHour,
    otherUtilityPerHour,
    utilityPerHour,
    maintenancePerHour,
    ohPerHour,
    toolingPerHour,
    manufacturingMhr,
    fullAbsorptionMhr,
    profitPerHour,
    sellingMhr,
    productiveHoursYear: hours,
    annualMfgCost,
    annualRevenue,
    annualProfit,
    calendar,
  };
}

export function computeAllMachines(
  factory: FactoryInputs,
  machines: MachineInputs[],
): Record<string, MhrBreakup> {
  const out: Record<string, MhrBreakup> = {};
  for (const m of machines) {
    out[m.id] = computeMachine(factory, m);
  }
  return out;
}

export function computePlantKpis(
  factory: FactoryInputs,
  machines: MachineInputs[],
  breakups: Record<string, MhrBreakup>,
): PlantKpis {
  const list = machines.map((m) => breakups[m.id]).filter(Boolean);
  const capacityHours = list.reduce(
    (s, b) => s + b.productiveHoursYear,
    0,
  );
  const annualMfgCost = list.reduce((s, b) => s + b.annualMfgCost, 0);
  const annualRevenue = list.reduce((s, b) => s + b.annualRevenue, 0);
  const annualProfit = list.reduce((s, b) => s + b.annualProfit, 0);
  const blendedMhr =
    capacityHours > 0 ? annualMfgCost / capacityHours : 0;
  const capacityValue = list.reduce(
    (s, b) => s + b.sellingMhr * b.productiveHoursYear,
    0,
  );

  // Opportunity cost: sum each machine's unused net hours × blended rate
  let fullHours = 0;
  for (const m of machines) {
    const cal = computeCalendar(resolveMachineCalendar(factory, m));
    fullHours += cal.netAvailableHours;
  }
  const idleHours = Math.max(0, fullHours - capacityHours);
  const underutilizationLoss = idleHours * blendedMhr;

  const utilSum = machines.reduce(
    (s, m) =>
      s + (m.utilizationPct ?? factory.utilizationPct),
    0,
  );
  const utilizationPct =
    machines.length > 0 ? utilSum / machines.length : factory.utilizationPct;

  const costCompositionAnnual = {
    emi: list.reduce((s, b) => s + b.emiPerHour * b.productiveHoursYear, 0),
    labour: list.reduce(
      (s, b) => s + b.labourPerHour * b.productiveHoursYear,
      0,
    ),
    utility: list.reduce(
      (s, b) => s + b.utilityPerHour * b.productiveHoursYear,
      0,
    ),
    utilityPower: list.reduce(
      (s, b) => s + b.electricityPerHour * b.productiveHoursYear,
      0,
    ),
    utilityOther: list.reduce(
      (s, b) => s + b.otherUtilityPerHour * b.productiveHoursYear,
      0,
    ),
    maintenance: list.reduce(
      (s, b) => s + b.maintenancePerHour * b.productiveHoursYear,
      0,
    ),
    overhead: list.reduce(
      (s, b) => s + b.ohPerHour * b.productiveHoursYear,
      0,
    ),
    tooling: list.reduce(
      (s, b) => s + b.toolingPerHour * b.productiveHoursYear,
      0,
    ),
  };

  return {
    machineCount: machines.length,
    employees: factory.employeesDirect + factory.employeesIndirect,
    landSqFt: factory.landSqFt,
    blendedMhr,
    capacityHours,
    capacityValue,
    annualMfgCost,
    annualRevenue,
    annualProfit,
    underutilizationLoss,
    electricityRate: factory.electricityRatePerKwh,
    utilizationPct,
    costCompositionAnnual,
  };
}

export function mergeFactory(
  base: FactoryInputs,
  patch?: Partial<FactoryInputs>,
): FactoryInputs {
  return patch ? { ...base, ...patch } : { ...base };
}

export function mergeMachines(
  base: MachineInputs[],
  patch?: Record<string, Partial<MachineInputs>>,
): MachineInputs[] {
  if (!patch) return base.map((m) => ({ ...m }));
  return base.map((m) =>
    patch[m.id] ? { ...m, ...patch[m.id] } : { ...m },
  );
}

export function resolveScenarioInputs(
  baseFactory: FactoryInputs,
  baseMachines: MachineInputs[],
  scenario: ScenarioDef,
) {
  const factory = mergeFactory(baseFactory, scenario.patches.factory);
  const machines = mergeMachines(baseMachines, scenario.patches.machines).map(
    (machine) => {
      const factors = scenario.relativeMachineFactors?.[machine.id];
      if (!factors) return machine;
      return {
        ...machine,
        labourAnnualAllocated:
          machine.labourAnnualAllocated *
          (factors.labourAnnualAllocated ?? 1),
        toolingAnnual:
          machine.toolingAnnual * (factors.toolingAnnual ?? 1),
        maintenanceAnnual:
          machine.maintenanceAnnual * (factors.maintenanceAnnual ?? 1),
      };
    },
  );
  return { factory, machines };
}
