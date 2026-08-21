export type FactoryInputs = {
  id: string;
  name: string;
  orgLabel: string;
  landSqFt: number;
  employeesDirect: number;
  employeesIndirect: number;
  electricityRatePerKwh: number;
  workingDaysPerMonth: number;
  workingDaysPerYear: number;
  shiftsPerDay: number;
  hoursPerShift: number;
  utilizationPct: number;
  availabilityPct: number;
  performancePct: number;
  qualityPct: number;
  plannedMaintHours: number;
  breakdownHours: number;
  setupHours: number;
};

export type MachineInputs = {
  id: string;
  name: string;
  type: string;
  status: "Running" | "Idle" | "Maintenance";
  machineCost: number;
  freight: number;
  installation: number;
  foundation: number;
  accessories: number;
  downPaymentPct: number;
  interestRatePct: number;
  tenureYears: number;
  lifeYears: number;
  salvagePct: number;
  powerKw: number;
  /** Non-power utility annual allocation (air, coolant, oil, water, misc). */
  otherUtilityAnnual: number;
  labourAnnualAllocated: number;
  toolingAnnual: number;
  maintenanceAnnual: number;
  factoryOhAnnual: number;
  desiredProfitPct: number;
  footprintSqFt: number;
  /** Per-machine calendar / OEE (Excel 01 + 05). */
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

export type CalendarResult = {
  availableHoursYear: number;
  netAvailableHours: number;
  oeePct: number;
  productiveHoursYear: number;
  productiveHoursMonth: number;
  productiveHoursDay: number;
};

export type MhrBreakup = {
  machineId: string;
  totalInvestment: number;
  loanAmount: number;
  monthlyEmi: number;
  annualEmi: number;
  emiPerHour: number;
  annualDepreciation: number;
  depreciationPerHour: number;
  labourPerHour: number;
  electricityPerHour: number;
  otherUtilityPerHour: number;
  utilityPerHour: number;
  maintenancePerHour: number;
  ohPerHour: number;
  toolingPerHour: number;
  /** Cash / operating MHR — excludes depreciation (Excel parity). */
  manufacturingMhr: number;
  /** Full absorption — includes depreciation. */
  fullAbsorptionMhr: number;
  profitPerHour: number;
  sellingMhr: number;
  productiveHoursYear: number;
  annualMfgCost: number;
  annualRevenue: number;
  annualProfit: number;
  calendar: CalendarResult;
};

/** Annual ₹ by Cash MHR head — plant-wide composition for Factory Pulse. */
export type CostCompositionAnnual = {
  emi: number;
  labour: number;
  utility: number;
  /** Power portion of utility (subset). */
  utilityPower: number;
  /** Non-power utility (subset). */
  utilityOther: number;
  maintenance: number;
  overhead: number;
  tooling: number;
};

export type PlantKpis = {
  machineCount: number;
  employees: number;
  landSqFt: number;
  blendedMhr: number;
  capacityHours: number;
  capacityValue: number;
  annualMfgCost: number;
  annualRevenue: number;
  annualProfit: number;
  underutilizationLoss: number;
  electricityRate: number;
  utilizationPct: number;
  costCompositionAnnual: CostCompositionAnnual;
};

export type ScenarioId = string;

export type ScenarioPatch = {
  factory?: Partial<FactoryInputs>;
  machines?: Record<string, Partial<MachineInputs>>;
};

export type ScenarioDef = {
  id: ScenarioId;
  name: string;
  description: string;
  patches: ScenarioPatch;
  /** Multipliers evaluated against the active operating baseline. */
  relativeMachineFactors?: Record<
    string,
    Partial<
      Record<"labourAnnualAllocated" | "toolingAnnual" | "maintenanceAnnual", number>
    >
  >;
  /** User-saved from Master data */
  custom?: boolean;
};

export type BaselineChange = {
  id: string;
  scope: "factory" | "machine";
  entityId: string;
  entityName: string;
  field: string;
  label: string;
  previousValue: string | number;
  nextValue: string | number;
  unit?: string;
};

export type BaselineVersion = {
  id: string;
  name: string;
  note?: string;
  createdAt: string;
  previousVersionId?: string;
  factory: FactoryInputs;
  machines: MachineInputs[];
  changes: BaselineChange[];
};

export type ExplainNode = {
  id: string;
  label: string;
  value: number;
  unit: string;
  formula: string;
  previousValue?: number;
  dependsOn: string[];
  children?: ExplainNode[];
};

export type ImpactStep = {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  unit: string;
  deltaLabel: string;
};

export type PartEconomics = {
  partId: string;
  /** Sum of process costs (est times × Cash MHR). */
  estCost: number;
  /** Sum of process costs (act times × Cash MHR). */
  actCost: number;
  /** Net material from part weights × grade rates. */
  materialCost: number;
  /** materialCost + estCost — used as quote costBasis. */
  totalCost: number;
  estTimeSec: number;
  actTimeSec: number;
};

export type QuoteEconomics = {
  quotationId: string;
  partId: string;
  unitPrice: number;
  /** Live total part cost (process + material). */
  costBasis: number;
  processCost: number;
  materialCost: number;
  grossMarginPct: number | null;
  markupPct: number | null;
  underwater: boolean;
};
