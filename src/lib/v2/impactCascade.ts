import type { ImpactStep, MhrBreakup } from "@/lib/factory/types";

/** Cascade step → Master data sub-screen. */
export const CASCADE_STEP_HREF: Record<string, string> = {
  "emi-hr": "/master-data/machines",
  "labour-hr": "/master-data/machines?tab=labour",
  "utility-hr": "/master-data/utilities",
  "maint-hr": "/master-data/machines",
  "oh-hr": "/master-data/overhead",
  "tooling-hr": "/master-data/tooling",
  "manufacturing-mhr": "/master-data",
};

export function cascadeStepHref(stepId: string): string | null {
  return CASCADE_STEP_HREF[stepId] ?? null;
}

export function buildMachineCascade(
  baseline: MhrBreakup,
  current: MhrBreakup,
): ImpactStep[] {
  const pct = (prev: number, next: number) => {
    if (!prev) return next === prev ? "—" : "new";
    const d = ((next - prev) / Math.abs(prev)) * 100;
    const sign = d > 0 ? "↑" : d < 0 ? "↓" : "→";
    return `${sign} ${Math.abs(d).toFixed(1)}%`;
  };
  return [
    {
      id: "emi-hr",
      label: "EMI / Hour",
      value: current.emiPerHour,
      previousValue: baseline.emiPerHour,
      unit: "₹/hr",
      deltaLabel: pct(baseline.emiPerHour, current.emiPerHour),
    },
    {
      id: "labour-hr",
      label: "Labour / Hour",
      value: current.labourPerHour,
      previousValue: baseline.labourPerHour,
      unit: "₹/hr",
      deltaLabel: pct(baseline.labourPerHour, current.labourPerHour),
    },
    {
      id: "utility-hr",
      label: "Utility + Power / Hour",
      value: current.utilityPerHour,
      previousValue: baseline.utilityPerHour,
      unit: "₹/hr",
      deltaLabel: pct(baseline.utilityPerHour, current.utilityPerHour),
    },
    {
      id: "maint-hr",
      label: "Maintenance / Hour",
      value: current.maintenancePerHour,
      previousValue: baseline.maintenancePerHour,
      unit: "₹/hr",
      deltaLabel: pct(baseline.maintenancePerHour, current.maintenancePerHour),
    },
    {
      id: "oh-hr",
      label: "Factory OH / Hour",
      value: current.ohPerHour,
      previousValue: baseline.ohPerHour,
      unit: "₹/hr",
      deltaLabel: pct(baseline.ohPerHour, current.ohPerHour),
    },
    {
      id: "tooling-hr",
      label: "Tooling / Hour",
      value: current.toolingPerHour,
      previousValue: baseline.toolingPerHour,
      unit: "₹/hr",
      deltaLabel: pct(baseline.toolingPerHour, current.toolingPerHour),
    },
    {
      id: "manufacturing-mhr",
      label: "Cash MHR",
      value: current.manufacturingMhr,
      previousValue: baseline.manufacturingMhr,
      unit: "₹/hr",
      deltaLabel: pct(baseline.manufacturingMhr, current.manufacturingMhr),
    },
  ];
}
