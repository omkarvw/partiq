import type { FactoryInputs, MachineInputs } from "@/lib/factory/types";
import { computeCalendar } from "@/lib/factory/calcEngine";

/** Bump key when onboarding schema changes so old drafts do not reopen. */
export const V2_STORAGE_KEY = "partiq-client-v10";
export const V2_SCHEMA_VERSION = 10;

export type SectionOrganizingHint =
  | "shopfloor"
  | "customer"
  | "line"
  | "other"
  | null;

/** Flexible machine bucket — shopfloor, customer, line, or any name. */
export type V2Section = {
  id: string;
  name: string;
  sortOrder: number;
};

export type V2UtilityLineMode = "annual" | "daily";

/** Excel 07-style utility lines (sum → otherUtilityAnnual for the engine). */
export type V2UtilityLine = {
  id: string;
  name: string;
  mode: V2UtilityLineMode;
  /** Used when mode === "annual". */
  annualAmount: number;
  /** Used when mode === "daily": qty/day × rate × workingDaysPerYear. */
  qtyPerDay: number;
  ratePerUnit: number;
};

export type OnboardingStep =
  | "welcome"
  | "tour"
  | "plant"
  | "sections"
  | "utilities"
  | "machines"
  | "overhead"
  | "review"
  | "complete";

export type PayBasis = "monthly" | "day_for_8h";
export type StaffingMode = "ratio" | "fixed";

export type V2LabourRole = {
  id: string;
  name: string;
  payBasis: PayBasis;
  monthlySalary: number;
  dayRateFor8h: number;
  staffingMode: StaffingMode;
  machinesPerHead: number;
  fixedHeadcount: number;
};

export type LabourRoleSuggestion = Omit<V2LabourRole, "id">;

export const LABOUR_ROLE_SUGGESTIONS: LabourRoleSuggestion[] = [
  {
    name: "Operator",
    payBasis: "day_for_8h",
    monthlySalary: 0,
    dayRateFor8h: 850,
    staffingMode: "ratio",
    machinesPerHead: 1,
    fixedHeadcount: 0,
  },
  {
    name: "Helper",
    payBasis: "day_for_8h",
    monthlySalary: 0,
    dayRateFor8h: 600,
    staffingMode: "ratio",
    machinesPerHead: 2,
    fixedHeadcount: 0,
  },
  {
    name: "Supervisor",
    payBasis: "monthly",
    monthlySalary: 45_000,
    dayRateFor8h: 0,
    staffingMode: "ratio",
    machinesPerHead: 6,
    fixedHeadcount: 0,
  },
  {
    name: "Programmer",
    payBasis: "monthly",
    monthlySalary: 45_000,
    dayRateFor8h: 0,
    staffingMode: "fixed",
    machinesPerHead: 1,
    fixedHeadcount: 1,
  },
];

export type V2Statutory = {
  pfPct: number;
  esicPct: number;
  bonusPct: number;
  gratuityPct: number;
  leaveReservePct: number;
};

export type OhKind = "people" | "rent" | "fixed_annual";

export type V2OhLine = {
  id: string;
  name: string;
  kind: OhKind;
  headcount: number;
  salaryPerMonth: number;
  areaSqFt: number;
  rentPerSqFtMonth: number;
  amountAnnual: number;
};

export type OverheadSuggestion = Omit<V2OhLine, "id">;

export const OVERHEAD_PEOPLE_SUGGESTIONS: OverheadSuggestion[] = [
  "Administration",
  "HR",
  "Accounts & Finance",
  "IT / Software / ERP",
  "Quality department",
  "Security",
  "Store / Inventory",
  "Purchase",
  "NPD / Design",
  "PPC",
  "Watchman",
  "Housekeeping",
].map((name) => ({
  name,
  kind: "people" as const,
  headcount: 1,
  salaryPerMonth: 0,
  areaSqFt: 0,
  rentPerSqFtMonth: 0,
  amountAnnual: 0,
}));

export type V2ToolingLine = {
  id: string;
  name: string;
  amountAnnual: number;
};

export type V2MachineDraft = {
  id: string;
  name: string;
  type: string;
  /** Flexible section bucket (shopfloor / customer / …). */
  sectionId: string | null;
  machineCost: number;
  freight: number;
  installation: number;
  foundation: number;
  accessories: number;
  interestRatePct: number;
  tenureYears: number;
  lifeYears: number;
  salvagePct: number;
  powerKw: number;
  /**
   * Legacy / derived annual other-utility total.
   * Prefer `utilityLines`; kept in sync when lines change.
   */
  otherUtilityAnnual: number;
  utilityLines: V2UtilityLine[];
  maintenanceAnnual: number;
  desiredProfitPct: number;
  footprintSqFt: number;
  /** Per-machine calendar / OEE */
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
  toolingOverride: V2ToolingLine[] | null;
};

export type V2PlantDraft = {
  name: string;
  orgLabel: string;
  city: string;
  /** Deferred — capacity planning. Kept at 0 for now. */
  shopFloorSqFt: number;
  spaceEfficiencyPct: number;
  electricityRatePerKwh: number;
  /**
   * Minimum gross margin % on quotes vs live process cost.
   * Set during onboarding; drives Urgent triage when parts fall short.
   */
  targetGrossMarginPct: number;
  /** Copy hint only — how the plant names its sections. */
  sectionOrganizingHint: SectionOrganizingHint;
};

export type V2BaselineSnapshot = {
  plant: V2PlantDraft;
  machines: V2MachineDraft[];
  machineTypes: string[];
  sections: V2Section[];
  toolingProfiles: Record<string, V2ToolingLine[]>;
  labourByType: Record<string, V2LabourRole[]>;
  statutory: V2Statutory;
  overheadLines: V2OhLine[];
};

export type V2BaselineVersion = {
  id: string;
  name: string;
  note?: string;
  createdAt: string;
  snapshot: V2BaselineSnapshot;
};

export type V2ScenarioVersion = {
  id: string;
  name: string;
  note?: string;
  createdAt: string;
  snapshot: V2BaselineSnapshot;
};

export type ImpactSectionId =
  | "plant"
  | "utilities"
  | "machines"
  | "labour"
  | "overhead"
  | "tooling";

export const IMPACT_SECTIONS = [
  { id: "plant" as const, label: "Plant", href: "/impact/plant" },
  { id: "utilities" as const, label: "Utilities", href: "/impact/utilities" },
  { id: "machines" as const, label: "Machines", href: "/impact/machines" },
  { id: "overhead" as const, label: "Overhead", href: "/impact/overhead" },
  { id: "tooling" as const, label: "Tooling", href: "/impact/tooling" },
];

/** Still tracked for dirty/preview; edits live under Machines → labour. */
export const IMPACT_LABOUR_HREF = "/impact/machines?tab=labour";

export type V2ClientRecord = {
  version: number;
  createdAt: string;
  updatedAt: string;
  onboardingComplete: boolean;
  lastStep: OnboardingStep;
  tourSeen: boolean;
  plant: V2PlantDraft;
  machines: V2MachineDraft[];
  machineTypes: string[];
  sections: V2Section[];
  toolingProfiles: Record<string, V2ToolingLine[]>;
  /** Direct labour roles scoped by machine type. */
  labourByType: Record<string, V2LabourRole[]>;
  statutory: V2Statutory;
  overheadLines: V2OhLine[];
  /** Versioned operating baselines (V2 primary). */
  baselines: V2BaselineVersion[];
  /** Named what-ifs that do not become live until adopted. */
  scenarios: V2ScenarioVersion[];
  activeBaselineId: string | null;
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyPlant(): V2PlantDraft {
  return {
    name: "",
    orgLabel: "",
    city: "",
    shopFloorSqFt: 0,
    spaceEfficiencyPct: 70,
    electricityRatePerKwh: 0,
    targetGrossMarginPct: 20,
    sectionOrganizingHint: null,
  };
}

export function createDefaultSection(name = "All machines"): V2Section {
  return {
    id: uid("sec"),
    name,
    sortOrder: 0,
  };
}

export function defaultUtilityLines(): V2UtilityLine[] {
  return [
    {
      id: uid("util"),
      name: "Compressed air",
      mode: "annual",
      annualAmount: 0,
      qtyPerDay: 0,
      ratePerUnit: 0,
    },
    {
      id: uid("util"),
      name: "Coolant",
      mode: "daily",
      annualAmount: 0,
      qtyPerDay: 0,
      ratePerUnit: 0,
    },
    {
      id: uid("util"),
      name: "Hydraulic oil",
      mode: "daily",
      annualAmount: 0,
      qtyPerDay: 0,
      ratePerUnit: 0,
    },
    {
      id: uid("util"),
      name: "Lubricants / grease",
      mode: "daily",
      annualAmount: 0,
      qtyPerDay: 0,
      ratePerUnit: 0,
    },
    {
      id: uid("util"),
      name: "Water",
      mode: "annual",
      annualAmount: 0,
      qtyPerDay: 0,
      ratePerUnit: 0,
    },
    {
      id: uid("util"),
      name: "Misc utility",
      mode: "annual",
      annualAmount: 0,
      qtyPerDay: 0,
      ratePerUnit: 0,
    },
  ];
}

export function utilityLineAnnual(
  line: V2UtilityLine,
  workingDaysPerYear: number,
): number {
  if (line.mode === "daily") {
    const days = workingDaysPerYear > 0 ? workingDaysPerYear : 365;
    return line.qtyPerDay * line.ratePerUnit * days;
  }
  return line.annualAmount;
}

export function sumUtilityLinesAnnual(
  lines: V2UtilityLine[],
  workingDaysPerYear: number,
): number {
  return lines.reduce(
    (s, line) => s + utilityLineAnnual(line, workingDaysPerYear),
    0,
  );
}

export function syncMachineUtilityAnnual(machine: V2MachineDraft): V2MachineDraft {
  const lines = machine.utilityLines ?? [];
  return {
    ...machine,
    utilityLines: lines,
    otherUtilityAnnual: sumUtilityLinesAnnual(
      lines,
      machine.workingDaysPerYear,
    ),
  };
}

export function defaultStatutory(): V2Statutory {
  return {
    pfPct: 13,
    esicPct: 3.25,
    bonusPct: 8.33,
    gratuityPct: 4.81,
    leaveReservePct: 5,
  };
}

export function defaultLabourRoles(): V2LabourRole[] {
  return LABOUR_ROLE_SUGGESTIONS.slice(0, 4).map((role, index) => ({
    ...role,
    id: `role-${role.name.toLowerCase().replaceAll(" ", "-")}-${index}`,
  }));
}

export function createLabourRole(
  name: string,
  defaults: Partial<LabourRoleSuggestion> = {},
): V2LabourRole {
  return {
    id: uid("role"),
    name,
    payBasis: "monthly",
    monthlySalary: 0,
    dayRateFor8h: 0,
    staffingMode: "ratio",
    machinesPerHead: 1,
    fixedHeadcount: 1,
    ...defaults,
  };
}

export function createOverheadLine(
  name: string,
  kind: OhKind = "fixed_annual",
  defaults: Partial<OverheadSuggestion> = {},
): V2OhLine {
  return {
    id: uid("oh"),
    name,
    kind,
    headcount: kind === "people" ? 1 : 0,
    salaryPerMonth: 0,
    areaSqFt: 0,
    rentPerSqFtMonth: 0,
    amountAnnual: 0,
    ...defaults,
  };
}

export function defaultOverheadLines(): V2OhLine[] {
  return [
    {
      id: "oh-admin",
      name: "Administration",
      kind: "people",
      headcount: 2,
      salaryPerMonth: 35_000,
      areaSqFt: 0,
      rentPerSqFtMonth: 0,
      amountAnnual: 0,
    },
    {
      id: "oh-hr",
      name: "HR",
      kind: "people",
      headcount: 1,
      salaryPerMonth: 40_000,
      areaSqFt: 0,
      rentPerSqFtMonth: 0,
      amountAnnual: 0,
    },
    {
      id: "oh-accounts",
      name: "Accounts & Finance",
      kind: "people",
      headcount: 2,
      salaryPerMonth: 38_000,
      areaSqFt: 0,
      rentPerSqFtMonth: 0,
      amountAnnual: 0,
    },
    {
      id: "oh-quality",
      name: "Quality department",
      kind: "people",
      headcount: 3,
      salaryPerMonth: 32_000,
      areaSqFt: 0,
      rentPerSqFtMonth: 0,
      amountAnnual: 0,
    },
    {
      id: "oh-security",
      name: "Security",
      kind: "people",
      headcount: 4,
      salaryPerMonth: 18_000,
      areaSqFt: 0,
      rentPerSqFtMonth: 0,
      amountAnnual: 0,
    },
    {
      id: "oh-rent",
      name: "Factory rent / lease",
      kind: "rent",
      headcount: 0,
      salaryPerMonth: 0,
      areaSqFt: 1800,
      rentPerSqFtMonth: 28,
      amountAnnual: 0,
    },
    {
      id: "oh-misc",
      name: "Miscellaneous overheads",
      kind: "fixed_annual",
      headcount: 0,
      salaryPerMonth: 0,
      areaSqFt: 0,
      rentPerSqFtMonth: 0,
      amountAnnual: 60_000,
    },
  ];
}

export function defaultToolingLines(): V2ToolingLine[] {
  return [
    { id: uid("tool"), name: "Inserts", amountAnnual: 50_000 },
    { id: uid("tool"), name: "Solid carbide tools", amountAnnual: 100_000 },
    { id: uid("tool"), name: "Drills / reamers / taps", amountAnnual: 150_000 },
    { id: uid("tool"), name: "Tool holders", amountAnnual: 80_000 },
    { id: uid("tool"), name: "Special tools", amountAnnual: 200_000 },
    { id: uid("tool"), name: "Regrinding / presetting", amountAnnual: 40_000 },
    { id: uid("tool"), name: "Tool crib & misc", amountAnnual: 80_000 },
  ];
}

export function resolveToolingLines(
  machine: V2MachineDraft,
  toolingProfiles: Record<string, V2ToolingLine[]>,
): V2ToolingLine[] {
  if (machine.toolingOverride) return machine.toolingOverride;
  return toolingProfiles[machine.type] ?? defaultToolingLines();
}

export function ensureToolingProfile(
  toolingProfiles: Record<string, V2ToolingLine[]>,
  types: string[],
): Record<string, V2ToolingLine[]> {
  let next = toolingProfiles;
  let mutated = false;
  for (const type of types) {
    if (!next[type]) {
      if (!mutated) {
        next = { ...toolingProfiles };
        mutated = true;
      }
      next[type] = defaultToolingLines();
    }
  }
  return next;
}

export function ensureLabourByType(
  labourByType: Record<string, V2LabourRole[]>,
  types: string[],
): Record<string, V2LabourRole[]> {
  let next = labourByType;
  let mutated = false;
  for (const type of types) {
    if (!next[type]) {
      if (!mutated) {
        next = { ...labourByType };
        mutated = true;
      }
      next[type] = defaultLabourRoles().map((role) => ({
        ...role,
        id: uid(`role-${type}`),
      }));
    }
  }
  return next;
}

export function defaultMachineCalendar(): Pick<
  V2MachineDraft,
  | "workingDaysPerMonth"
  | "workingDaysPerYear"
  | "shiftsPerDay"
  | "hoursPerShift"
  | "utilizationPct"
  | "performancePct"
  | "qualityPct"
  | "plannedMaintHours"
  | "breakdownHours"
  | "setupHours"
> {
  return {
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
  };
}

export function createEmptyMachine(
  index = 1,
  type = "VMC",
  sectionId: string | null = null,
): V2MachineDraft {
  const cal = defaultMachineCalendar();
  return syncMachineUtilityAnnual({
    id: uid("mch"),
    name: `${type} ${index}`,
    type,
    sectionId,
    machineCost: 0,
    freight: 0,
    installation: 0,
    foundation: 0,
    accessories: 0,
    interestRatePct: 8.5,
    tenureYears: 5,
    lifeYears: 10,
    salvagePct: 10,
    powerKw: type === "VMC" ? 10 : 7.5,
    otherUtilityAnnual: 0,
    utilityLines: defaultUtilityLines(),
    maintenanceAnnual: 0,
    desiredProfitPct: 30,
    footprintSqFt: 0,
    ...cal,
    toolingOverride: null,
  });
}

export function createEmptyClientRecord(): V2ClientRecord {
  const now = new Date().toISOString();
  const section = createDefaultSection();
  return {
    version: V2_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    onboardingComplete: false,
    lastStep: "welcome",
    tourSeen: false,
    plant: createEmptyPlant(),
    machines: [],
    machineTypes: [],
    sections: [section],
    toolingProfiles: {},
    labourByType: {},
    statutory: defaultStatutory(),
    overheadLines: defaultOverheadLines(),
    baselines: [],
    scenarios: [],
    activeBaselineId: null,
  };
}

export function snapshotFromRecord(record: V2ClientRecord): V2BaselineSnapshot {
  return {
    plant: structuredClone(record.plant),
    machines: structuredClone(record.machines),
    machineTypes: [...record.machineTypes],
    sections: structuredClone(record.sections),
    toolingProfiles: structuredClone(record.toolingProfiles),
    labourByType: structuredClone(record.labourByType),
    statutory: { ...record.statutory },
    overheadLines: structuredClone(record.overheadLines),
  };
}

export function applySnapshotToRecord(
  record: V2ClientRecord,
  snapshot: V2BaselineSnapshot,
): V2ClientRecord {
  return {
    ...record,
    plant: structuredClone(snapshot.plant),
    machines: structuredClone(snapshot.machines),
    machineTypes: [...snapshot.machineTypes],
    sections: structuredClone(snapshot.sections ?? record.sections),
    toolingProfiles: structuredClone(snapshot.toolingProfiles),
    labourByType: structuredClone(snapshot.labourByType),
    statutory: { ...snapshot.statutory },
    overheadLines: structuredClone(snapshot.overheadLines),
  };
}

export function createBaselineVersion(
  name: string,
  record: V2ClientRecord,
  note?: string,
): V2BaselineVersion {
  return {
    id: uid("baseline"),
    name: name.trim() || "Operating baseline",
    note: note?.trim() || undefined,
    createdAt: new Date().toISOString(),
    snapshot: snapshotFromRecord(record),
  };
}

export function createScenarioVersion(
  name: string,
  snapshot: V2BaselineSnapshot,
  note?: string,
): V2ScenarioVersion {
  return {
    id: uid("scenario"),
    name: name.trim() || "Untitled scenario",
    note: note?.trim() || undefined,
    createdAt: new Date().toISOString(),
    snapshot: structuredClone(snapshot),
  };
}

/** Build a transient client record from a snapshot for calc engine input. */
export function clientRecordFromSnapshot(
  snap: V2BaselineSnapshot,
): V2ClientRecord {
  const empty = createEmptyClientRecord();
  return {
    ...empty,
    ...applySnapshotToRecord(empty, snap),
    onboardingComplete: true,
  };
}

export function examplePlant(): V2PlantDraft {
  return {
    name: "Pune West Plant",
    orgLabel: "ORG-1204",
    city: "Pune",
    shopFloorSqFt: 0,
    spaceEfficiencyPct: 70,
    electricityRatePerKwh: 10,
    targetGrossMarginPct: 20,
    sectionOrganizingHint: "shopfloor",
  };
}

export function exampleMachines(sectionId: string | null = null): V2MachineDraft[] {
  const cal = defaultMachineCalendar();
  const vmcLines = defaultUtilityLines().map((line) => {
    if (line.name === "Misc utility") {
      return { ...line, mode: "annual" as const, annualAmount: 272_602.5 };
    }
    return line;
  });
  const latheLines = defaultUtilityLines().map((line) => {
    if (line.name === "Misc utility") {
      return { ...line, mode: "annual" as const, annualAmount: 80_000 };
    }
    return line;
  });
  return [
    syncMachineUtilityAnnual({
      ...createEmptyMachine(1, "VMC", sectionId),
      id: "example-vmc-1",
      name: "Brother VMC",
      machineCost: 4_000_000,
      freight: 50_000,
      foundation: 50_000,
      accessories: 500_000,
      powerKw: 10,
      utilityLines: vmcLines,
      maintenanceAnnual: 143_000,
      desiredProfitPct: 40,
      ...cal,
      hoursPerShift: 12,
      workingDaysPerMonth: 20,
      workingDaysPerYear: 240,
      toolingOverride: null,
    }),
    syncMachineUtilityAnnual({
      ...createEmptyMachine(1, "CNC Lathe", sectionId),
      id: "example-cnc-1",
      name: "CNC Lathe 1",
      machineCost: 2_200_000,
      freight: 30_000,
      installation: 40_000,
      foundation: 25_000,
      accessories: 150_000,
      powerKw: 7.5,
      utilityLines: latheLines,
      maintenanceAnnual: 85_000,
      desiredProfitPct: 30,
      ...cal,
      toolingOverride: null,
    }),
  ];
}

export function exampleToolingProfiles(): Record<string, V2ToolingLine[]> {
  return {
    VMC: defaultToolingLines().map((line, i) => ({
      ...line,
      id: `ex-tool-vmc-${i}`,
      amountAnnual: Math.round(line.amountAnnual * 1.4),
    })),
    "CNC Lathe": defaultToolingLines().map((line, i) => ({
      ...line,
      id: `ex-tool-cnc-${i}`,
      amountAnnual: Math.round(line.amountAnnual * 0.7),
    })),
  };
}

export function exampleLabourByType(): Record<string, V2LabourRole[]> {
  return {
    VMC: defaultLabourRoles().map((role, i) => ({
      ...role,
      id: `ex-role-vmc-${i}`,
    })),
    "CNC Lathe": defaultLabourRoles().map((role, i) => ({
      ...role,
      id: `ex-role-cnc-${i}`,
      machinesPerHead: role.name === "Operator" ? 2 : role.machinesPerHead,
    })),
  };
}

export function addMachinesOfType(
  existing: V2MachineDraft[],
  type: string,
  count: number,
  defaults?: Partial<V2MachineDraft>,
): V2MachineDraft[] {
  const sameType = existing.filter((m) => m.type === type).length;
  const added: V2MachineDraft[] = [];
  for (let i = 0; i < count; i += 1) {
    const draft = syncMachineUtilityAnnual({
      ...createEmptyMachine(
        sameType + i + 1,
        type,
        defaults?.sectionId ?? null,
      ),
      ...defaults,
      id: uid("mch"),
      name:
        defaults?.name && count === 1
          ? defaults.name
          : defaults?.name
            ? `${defaults.name} ${sameType + i + 1}`
            : `${type} ${sameType + i + 1}`,
      type,
      toolingOverride: null,
    });
    added.push(draft);
  }
  return [...existing, ...added];
}

export function statutoryLoadPct(s: V2Statutory) {
  return s.pfPct + s.esicPct + s.bonusPct + s.gratuityPct + s.leaveReservePct;
}

export function requiredHeadcount(role: V2LabourRole, machineCount: number) {
  if (role.staffingMode === "fixed") {
    return Math.max(0, role.fixedHeadcount);
  }
  return Math.ceil(Math.max(0, machineCount) / Math.max(1, role.machinesPerHead));
}

export function rolePlantMonthly(role: V2LabourRole, machineCount: number) {
  const headcount = requiredHeadcount(role, machineCount);
  if (role.payBasis === "day_for_8h") {
    return role.dayRateFor8h * 26 * headcount;
  }
  return role.monthlySalary * headcount;
}

export function roleAnnualPerMachine(
  role: V2LabourRole,
  statutory: V2Statutory,
  machineCount: number,
) {
  const machines = Math.max(1, machineCount);
  const headcount = requiredHeadcount(role, machineCount);
  const monthlyPlant = rolePlantMonthly(role, machineCount);
  const monthlyPerMachine = monthlyPlant / machines;
  const annualBasic = monthlyPerMachine * 12;
  const loadFactor = 1 + statutoryLoadPct(statutory) / 100;
  const annualLoaded = annualBasic * loadFactor;
  return {
    headcount,
    monthlyPlant,
    monthlyPerMachine,
    annualBasic,
    annualLoaded,
    annualLoadedPlant: monthlyPlant * 12 * loadFactor,
  };
}

export function directLabourAnnualPerMachine(
  roles: V2LabourRole[],
  statutory: V2Statutory,
  machineCount: number,
) {
  return roles.reduce(
    (sum, role) =>
      sum + roleAnnualPerMachine(role, statutory, machineCount).annualLoaded,
    0,
  );
}

/** Labour ₹/yr for one machine using its type's role list. */
export function labourAnnualForMachine(
  machine: V2MachineDraft,
  record: V2ClientRecord,
) {
  const typeCount = record.machines.filter((m) => m.type === machine.type).length;
  const roles = record.labourByType[machine.type] ?? [];
  return directLabourAnnualPerMachine(roles, record.statutory, typeCount);
}

export function overheadAnnualPlant(lines: V2OhLine[]) {
  return lines.reduce((sum, line) => {
    if (line.kind === "people") {
      return sum + line.headcount * line.salaryPerMonth * 12;
    }
    if (line.kind === "rent") {
      return sum + line.areaSqFt * line.rentPerSqFtMonth * 12;
    }
    return sum + line.amountAnnual;
  }, 0);
}

export function overheadAnnualPerMachine(
  lines: V2OhLine[],
  machineCount: number,
) {
  const n = Math.max(1, machineCount);
  return overheadAnnualPlant(lines) / n;
}

export function toolingAnnual(lines: V2ToolingLine[]) {
  return lines.reduce((sum, line) => sum + line.amountAnnual, 0);
}

export function machineToolingAnnual(
  machine: V2MachineDraft,
  toolingProfiles: Record<string, V2ToolingLine[]>,
) {
  return toolingAnnual(resolveToolingLines(machine, toolingProfiles));
}

/** Productive hours/year for a draft machine (for ₹/hr previews). */
export function machineProductiveHours(machine: V2MachineDraft) {
  return computeCalendar({
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
  }).productiveHoursYear;
}

export function annualToPerHour(annual: number, productiveHours: number) {
  return productiveHours > 0 ? annual / productiveHours : 0;
}

export function machineOeeReadout(machine: V2MachineDraft) {
  return computeCalendar({
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
  });
}

export function distinctMachineTypes(record: V2ClientRecord): string[] {
  return Array.from(
    new Set(record.machines.map((m) => m.type).filter(Boolean)),
  ).sort();
}

/** Drop types that no longer have any machines; keep labour/tooling only for live types. */
export function pruneEmptyMachineTypes(
  record: Pick<
    V2ClientRecord,
    "machines" | "machineTypes" | "labourByType" | "toolingProfiles"
  >,
): Pick<V2ClientRecord, "machineTypes" | "labourByType" | "toolingProfiles"> {
  const live = Array.from(
    new Set(record.machines.map((m) => m.type).filter(Boolean)),
  ).sort();
  const labourByType: Record<string, V2LabourRole[]> = {};
  const toolingProfiles: Record<string, V2ToolingLine[]> = {};
  for (const type of live) {
    if (record.labourByType[type]) labourByType[type] = record.labourByType[type];
    if (record.toolingProfiles[type]) {
      toolingProfiles[type] = record.toolingProfiles[type];
    }
  }
  return {
    machineTypes: live,
    labourByType: ensureLabourByType(labourByType, live),
    toolingProfiles: ensureToolingProfile(toolingProfiles, live),
  };
}

export function toFactoryInputs(
  plant: V2PlantDraft,
  record: V2ClientRecord,
): FactoryInputs {
  const types = distinctMachineTypes(record);
  let direct = 0;
  for (const type of types) {
    const count = record.machines.filter((m) => m.type === type).length;
    const roles = record.labourByType[type] ?? [];
    direct += roles.reduce(
      (sum, role) => sum + requiredHeadcount(role, count),
      0,
    );
  }
  const indirect = record.overheadLines
    .filter((line) => line.kind === "people")
    .reduce((sum, line) => sum + line.headcount, 0);
  const first = record.machines[0];
  return {
    id: "fac-client",
    name: plant.name || "Unnamed plant",
    orgLabel: plant.orgLabel || "ORG-NEW",
    landSqFt: plant.shopFloorSqFt,
    employeesDirect: direct,
    employeesIndirect: indirect,
    electricityRatePerKwh: plant.electricityRatePerKwh,
    workingDaysPerMonth: first?.workingDaysPerMonth ?? 20,
    workingDaysPerYear: first?.workingDaysPerYear ?? 240,
    shiftsPerDay: first?.shiftsPerDay ?? 1,
    hoursPerShift: first?.hoursPerShift ?? 8,
    utilizationPct: first?.utilizationPct ?? 85,
    availabilityPct: 100,
    performancePct: first?.performancePct ?? 95,
    qualityPct: first?.qualityPct ?? 98,
    plannedMaintHours: first?.plannedMaintHours ?? 0,
    breakdownHours: first?.breakdownHours ?? 0,
    setupHours: first?.setupHours ?? 0,
  };
}

export function toMachineInputs(record: V2ClientRecord): MachineInputs[] {
  const oh = overheadAnnualPerMachine(
    record.overheadLines,
    record.machines.length,
  );
  return record.machines.map((machine) => ({
    id: machine.id,
    name: machine.name || "Unnamed machine",
    type: machine.type || "Machine",
    status: "Running" as const,
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
    otherUtilityAnnual: sumUtilityLinesAnnual(
      machine.utilityLines ?? [],
      machine.workingDaysPerYear,
    ) || machine.otherUtilityAnnual,
    labourAnnualAllocated: labourAnnualForMachine(machine, record),
    toolingAnnual: machineToolingAnnual(machine, record.toolingProfiles),
    maintenanceAnnual: machine.maintenanceAnnual,
    factoryOhAnnual: oh,
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
  }));
}

export function migrateMachineDraft(
  raw: Partial<V2MachineDraft> & {
    otherUtilityAnnual?: number;
    utilityLines?: V2UtilityLine[];
    sectionId?: string | null;
  },
  fallbackSectionId: string | null,
): V2MachineDraft {
  const base = createEmptyMachine(1, raw.type || "VMC", fallbackSectionId);
  const merged: V2MachineDraft = {
    ...base,
    ...raw,
    id: raw.id || base.id,
    name: raw.name || base.name,
    type: raw.type || base.type,
    sectionId:
      raw.sectionId !== undefined ? raw.sectionId : fallbackSectionId,
    utilityLines: Array.isArray(raw.utilityLines) ? raw.utilityLines : [],
    otherUtilityAnnual: raw.otherUtilityAnnual ?? 0,
    toolingOverride: raw.toolingOverride ?? null,
  };
  if (!merged.utilityLines.length && (merged.otherUtilityAnnual ?? 0) > 0) {
    merged.utilityLines = defaultUtilityLines().map((line) =>
      line.name === "Misc utility"
        ? {
            ...line,
            mode: "annual" as const,
            annualAmount: merged.otherUtilityAnnual,
          }
        : line,
    );
  }
  if (!merged.utilityLines.length) {
    merged.utilityLines = defaultUtilityLines();
  }
  return syncMachineUtilityAnnual(merged);
}

export function migrateClientRecord(raw: Record<string, unknown>): V2ClientRecord {
  const empty = createEmptyClientRecord();
  const plantRaw = (raw.plant ?? {}) as Partial<V2PlantDraft>;
  const sectionList = Array.isArray(raw.sections)
    ? (raw.sections as V2Section[])
    : [];
  const sections =
    sectionList.length > 0
      ? sectionList.map((s, i) => ({
          id: s.id || uid("sec"),
          name: s.name || `Section ${i + 1}`,
          sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : i,
        }))
      : [createDefaultSection()];
  const defaultSecId = sections[0]?.id ?? null;
  const machinesRaw = Array.isArray(raw.machines)
    ? (raw.machines as Partial<V2MachineDraft>[])
    : [];
  const machines = machinesRaw.map((m) =>
    migrateMachineDraft(m, defaultSecId),
  );

  const migrateSnap = (snap: unknown): V2BaselineSnapshot | null => {
    if (!snap || typeof snap !== "object") return null;
    const s = snap as Partial<V2BaselineSnapshot>;
    const snapSections =
      Array.isArray(s.sections) && s.sections.length > 0
        ? s.sections
        : sections;
    const snapSecId = snapSections[0]?.id ?? defaultSecId;
    return {
      plant: {
        ...empty.plant,
        ...(s.plant ?? {}),
        sectionOrganizingHint:
          s.plant?.sectionOrganizingHint ??
          plantRaw.sectionOrganizingHint ??
          null,
        targetGrossMarginPct:
          s.plant?.targetGrossMarginPct ??
          plantRaw.targetGrossMarginPct ??
          20,
      },
      machines: (s.machines ?? []).map((m) =>
        migrateMachineDraft(m, snapSecId),
      ),
      machineTypes: [...(s.machineTypes ?? [])],
      sections: snapSections,
      toolingProfiles: structuredClone(s.toolingProfiles ?? {}),
      labourByType: structuredClone(s.labourByType ?? {}),
      statutory: { ...empty.statutory, ...(s.statutory ?? {}) },
      overheadLines: structuredClone(
        s.overheadLines ?? empty.overheadLines,
      ),
    };
  };

  const baselines = Array.isArray(raw.baselines)
    ? (raw.baselines as V2BaselineVersion[]).map((b) => ({
        ...b,
        snapshot: migrateSnap(b.snapshot) ?? snapshotFromRecord(empty),
      }))
    : [];
  const scenarios = Array.isArray(raw.scenarios)
    ? (raw.scenarios as V2ScenarioVersion[]).map((s) => ({
        ...s,
        snapshot: migrateSnap(s.snapshot) ?? snapshotFromRecord(empty),
      }))
    : [];

  return {
    ...empty,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : empty.createdAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : empty.updatedAt,
    onboardingComplete: Boolean(raw.onboardingComplete),
    lastStep: (raw.lastStep as OnboardingStep) || "welcome",
    tourSeen: Boolean(raw.tourSeen),
    plant: {
      ...empty.plant,
      ...plantRaw,
      sectionOrganizingHint: plantRaw.sectionOrganizingHint ?? null,
      targetGrossMarginPct:
        typeof plantRaw.targetGrossMarginPct === "number"
          ? plantRaw.targetGrossMarginPct
          : 20,
    },
    machines,
    machineTypes: Array.isArray(raw.machineTypes)
      ? (raw.machineTypes as string[])
      : [],
    sections,
    toolingProfiles: structuredClone(
      (raw.toolingProfiles as V2ClientRecord["toolingProfiles"]) ?? {},
    ),
    labourByType: structuredClone(
      (raw.labourByType as V2ClientRecord["labourByType"]) ?? {},
    ),
    statutory: {
      ...empty.statutory,
      ...((raw.statutory as V2Statutory) ?? {}),
    },
    overheadLines: Array.isArray(raw.overheadLines)
      ? (raw.overheadLines as V2OhLine[])
      : empty.overheadLines,
    baselines,
    scenarios,
    activeBaselineId:
      typeof raw.activeBaselineId === "string" || raw.activeBaselineId === null
        ? (raw.activeBaselineId as string | null)
        : null,
    version: V2_SCHEMA_VERSION,
  };
}

export function readClientRecord(): V2ClientRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(V2_STORAGE_KEY) ??
      window.localStorage.getItem("partiq-client-v9") ??
      window.localStorage.getItem("partiq-client-v8");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version?: number };
    if (
      !parsed ||
      (parsed.version !== 8 &&
        parsed.version !== 9 &&
        parsed.version !== 10)
    ) {
      return null;
    }
    return migrateClientRecord(parsed as Record<string, unknown>);
  } catch {
    return null;
  }
}

export function writeClientRecord(record: V2ClientRecord) {
  const next = {
    ...record,
    version: V2_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearClientRecord() {
  window.localStorage.removeItem(V2_STORAGE_KEY);
  window.localStorage.removeItem("partiq-client-v9");
  window.localStorage.removeItem("partiq-client-v8");
  window.localStorage.removeItem("partiq-client-v7");
  window.localStorage.removeItem("partiq-client-v6");
  window.localStorage.removeItem("partiq-client-v5");
  window.localStorage.removeItem("partiq-client-v4");
  window.localStorage.removeItem("partiq-client-v3");
  window.localStorage.removeItem("partiq-client-v2");
}

export function hasCompletedOnboarding(record: V2ClientRecord | null) {
  return Boolean(record?.onboardingComplete && record.machines.length > 0);
}
