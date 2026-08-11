import type {
  V2ClientRecord,
  V2MachineDraft,
  V2OhLine,
} from "@/lib/v2/clientDb";
import {
  machineToolingAnnual,
  overheadAnnualPlant,
} from "@/lib/v2/clientDb";

export type FieldIssue = {
  key: string;
  label: string;
  severity: "error" | "warn";
};

export function plantIssues(record: V2ClientRecord): FieldIssue[] {
  const issues: FieldIssue[] = [];
  if (!record.plant.name.trim()) {
    issues.push({ key: "name", label: "Plant name", severity: "error" });
  }
  if (!record.plant.city.trim()) {
    issues.push({ key: "city", label: "City", severity: "error" });
  }
  return issues;
}

export function utilityIssues(record: V2ClientRecord): FieldIssue[] {
  const issues: FieldIssue[] = [];
  if (!(record.plant.electricityRatePerKwh > 0)) {
    issues.push({
      key: "tariff",
      label: "Electricity ₹/kWh",
      severity: "error",
    });
  }
  return issues;
}

export function machineIssues(machine: V2MachineDraft): FieldIssue[] {
  const issues: FieldIssue[] = [];
  if (!machine.name.trim()) {
    issues.push({ key: "name", label: "Machine name", severity: "error" });
  }
  if (!(machine.machineCost > 0)) {
    issues.push({ key: "cost", label: "Machine cost", severity: "error" });
  }
  if (!(machine.workingDaysPerYear > 0)) {
    issues.push({
      key: "daysYear",
      label: "Working days / year",
      severity: "error",
    });
  }
  if (!(machine.shiftsPerDay > 0)) {
    issues.push({ key: "shifts", label: "Shifts / day", severity: "error" });
  }
  if (!(machine.hoursPerShift > 0)) {
    issues.push({
      key: "hours",
      label: "Hours / shift",
      severity: "error",
    });
  }
  if (!(machine.utilizationPct > 0)) {
    issues.push({
      key: "util",
      label: "Utilization %",
      severity: "error",
    });
  }
  if (!(machine.powerKw > 0)) {
    issues.push({
      key: "kw",
      label: "Connected load (kW)",
      severity: "error",
    });
  }
  if (!(machine.interestRatePct >= 0) || !(machine.tenureYears > 0)) {
    issues.push({
      key: "finance",
      label: "Interest % / tenure",
      severity: "warn",
    });
  }
  if (!(machine.maintenanceAnnual > 0)) {
    issues.push({
      key: "maint",
      label: "Maintenance ₹/year",
      severity: "warn",
    });
  }
  if (!(machine.otherUtilityAnnual > 0)) {
    issues.push({
      key: "otherUtil",
      label: "Other utility ₹/year",
      severity: "warn",
    });
  }
  return issues;
}

export function machinesStepIssues(record: V2ClientRecord): FieldIssue[] {
  if (record.machines.length === 0) {
    return [
      {
        key: "machines",
        label: "Add at least one machine",
        severity: "error",
      },
    ];
  }
  const out: FieldIssue[] = [];
  for (const machine of record.machines) {
    for (const issue of machineIssues(machine)) {
      if (issue.severity === "error") {
        out.push({
          ...issue,
          key: `${machine.id}-${issue.key}`,
          label: `${machine.name || "Machine"} · ${issue.label}`,
        });
      }
    }
    const roles = record.labourByType[machine.type] ?? [];
    if (roles.length === 0) {
      out.push({
        key: `labour-${machine.type}`,
        label: `${machine.type} · labour roles`,
        severity: "error",
      });
    }
    const tooling = machineToolingAnnual(machine, record.toolingProfiles);
    if (tooling <= 0) {
      out.push({
        key: `tooling-${machine.id}`,
        label: `${machine.name} · tooling`,
        severity: "warn",
      });
    }
  }
  return out;
}

export function overheadIssues(record: V2ClientRecord): FieldIssue[] {
  const issues: FieldIssue[] = [];
  if (overheadAnnualPlant(record.overheadLines) <= 0) {
    issues.push({
      key: "oh",
      label: "At least one factory overhead line with amount",
      severity: "error",
    });
  }
  for (const line of record.overheadLines) {
    if (ohLineEmpty(line)) {
      issues.push({
        key: line.id,
        label: `${line.name} is incomplete`,
        severity: "warn",
      });
    }
  }
  return issues;
}

function ohLineEmpty(line: V2OhLine) {
  if (line.kind === "people") {
    return !(line.headcount > 0 && line.salaryPerMonth > 0);
  }
  if (line.kind === "rent") {
    return !(line.areaSqFt > 0 && line.rentPerSqFtMonth > 0);
  }
  return !(line.amountAnnual > 0);
}

export function machineIsComplete(machine: V2MachineDraft) {
  return machineIssues(machine).every((i) => i.severity !== "error");
}
