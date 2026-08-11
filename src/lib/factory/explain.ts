import type { FactoryInputs, MachineInputs, MhrBreakup, ExplainNode } from "./types";
import { formatInr } from "@/lib/costing";

function inr(n: number): string {
  return formatInr(n);
}

export function buildMhrExplainTree(
  factory: FactoryInputs,
  machine: MachineInputs,
  breakup: MhrBreakup,
): ExplainNode {
  return {
    id: "selling-mhr",
    label: "Selling MHR",
    value: breakup.sellingMhr,
    unit: "₹/hr",
    formula: "Manufacturing MHR + Profit / Hour",
    dependsOn: ["manufacturing-mhr", "profit-hr"],
    children: [
      {
        id: "manufacturing-mhr",
        label: "Manufacturing MHR (cash)",
        value: breakup.manufacturingMhr,
        unit: "₹/hr",
        formula:
          "EMI + Labour + Utility + Maintenance + Factory OH + Tooling (excl. depreciation)",
        dependsOn: [
          "emi-hr",
          "labour-hr",
          "utility-hr",
          "maint-hr",
          "oh-hr",
          "tooling-hr",
        ],
        children: [
          {
            id: "emi-hr",
            label: "EMI / Hour",
            value: breakup.emiPerHour,
            unit: "₹/hr",
            formula:
              "(Monthly EMI ÷ Working days/month) ÷ Productive hours/day",
            dependsOn: ["loan", "interest", "tenure", "calendar"],
            children: [
              {
                id: "loan",
                label: "Loan amount",
                value: breakup.loanAmount,
                unit: "₹",
                formula: "Total investment − Down payment",
                dependsOn: ["investment"],
              },
              {
                id: "investment",
                label: "Total investment",
                value: breakup.totalInvestment,
                unit: "₹",
                formula:
                  "Machine + Freight + Installation + Foundation + Accessories",
                dependsOn: [],
              },
              {
                id: "monthly-emi",
                label: "Monthly EMI",
                value: breakup.monthlyEmi,
                unit: "₹",
                formula: `PMT(${machine.interestRatePct}% p.a., ${machine.tenureYears * 12} months, loan)`,
                dependsOn: ["loan"],
              },
            ],
          },
          {
            id: "labour-hr",
            label: "Labour / Hour",
            value: breakup.labourPerHour,
            unit: "₹/hr",
            formula: "Allocated annual labour (incl. statutory) ÷ Productive hours",
            dependsOn: ["labour-annual", "productive-hours"],
            children: [
              {
                id: "labour-annual",
                label: "Labour allocated / year",
                value: machine.labourAnnualAllocated,
                unit: "₹",
                formula: "Operator + helper + supervisor + PF/ESI/bonus/gratuity/leave",
                dependsOn: [],
              },
            ],
          },
          {
            id: "utility-hr",
            label: "Utility + Power / Hour",
            value: breakup.utilityPerHour,
            unit: "₹/hr",
            formula: "Electricity / hr + Other utilities / hr",
            dependsOn: ["electricity-hr", "other-utility-hr"],
            children: [
              {
                id: "electricity-hr",
                label: "Electricity / Hour",
                value: breakup.electricityPerHour,
                unit: "₹/hr",
                formula: `${machine.powerKw} kW × ${inr(factory.electricityRatePerKwh)}/kWh`,
                dependsOn: ["tariff", "power-kw"],
              },
              {
                id: "tariff",
                label: "Electricity tariff",
                value: factory.electricityRatePerKwh,
                unit: "₹/kWh",
                formula: "Semi-static plant input (editable in Impact)",
                dependsOn: [],
              },
              {
                id: "other-utility-hr",
                label: "Other utilities / Hour",
                value: breakup.otherUtilityPerHour,
                unit: "₹/hr",
                formula: "Air + coolant + oil + water + misc ÷ Productive hours",
                dependsOn: [],
              },
            ],
          },
          {
            id: "maint-hr",
            label: "Maintenance / Hour",
            value: breakup.maintenancePerHour,
            unit: "₹/hr",
            formula: "AMC + preventive + spares ÷ Productive hours",
            dependsOn: [],
          },
          {
            id: "oh-hr",
            label: "Factory Overhead / Hour",
            value: breakup.ohPerHour,
            unit: "₹/hr",
            formula: "Shared plant OH allocated to this machine ÷ Productive hours",
            dependsOn: [],
          },
          {
            id: "tooling-hr",
            label: "Tooling / Hour",
            value: breakup.toolingPerHour,
            unit: "₹/hr",
            formula: "Annual tooling spend ÷ Productive hours",
            dependsOn: [],
          },
          {
            id: "dep-hr",
            label: "Depreciation / Hour (memo)",
            value: breakup.depreciationPerHour,
            unit: "₹/hr",
            formula:
              "SLM annual depreciation ÷ Available hours — shown but excluded from cash MHR",
            dependsOn: ["investment"],
          },
        ],
      },
      {
        id: "profit-hr",
        label: "Profit / Hour",
        value: breakup.profitPerHour,
        unit: "₹/hr",
        formula: `Manufacturing MHR × ${machine.desiredProfitPct}%`,
        dependsOn: ["manufacturing-mhr"],
      },
      {
        id: "full-mhr",
        label: "Full absorption MHR",
        value: breakup.fullAbsorptionMhr,
        unit: "₹/hr",
        formula: "Manufacturing MHR + Depreciation / Hour",
        dependsOn: ["manufacturing-mhr", "dep-hr"],
      },
      {
        id: "productive-hours",
        label: "Productive hours / year",
        value: breakup.productiveHoursYear,
        unit: "hrs",
        formula: "Net available hours × Utilization %",
        dependsOn: ["utilization", "calendar"],
        children: [
          {
            id: "utilization",
            label: "Machine utilization",
            value: machine.utilizationPct ?? factory.utilizationPct,
            unit: "%",
            formula: "Per-machine lever (editable in setup / Impact)",
            dependsOn: [],
          },
          {
            id: "calendar",
            label: "Available hours / year",
            value: breakup.calendar.availableHoursYear,
            unit: "hrs",
            formula: "Machine working days × Shifts × Hours / shift",
            dependsOn: [],
          },
          {
            id: "oee",
            label: "OEE (display)",
            value: breakup.calendar.oeePct,
            unit: "%",
            formula: "Availability × Performance × Quality (does not change Cash MHR)",
            dependsOn: [],
          },
        ],
      },
      {
        id: "annual-profit",
        label: "Annual profit (model)",
        value: breakup.annualProfit,
        unit: "₹",
        formula: "Annual revenue recovery − Annual manufacturing cost",
        dependsOn: ["selling-mhr", "productive-hours"],
      },
    ],
  };
}

export function findExplainNode(
  root: ExplainNode,
  id: string,
): ExplainNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findExplainNode(child, id);
    if (found) return found;
  }
  return null;
}
