"use client";

import { formatInr } from "@/lib/costing";
import type { MhrBreakup, PlantKpis, ScenarioDef } from "@/lib/factory/types";
import { Button, StatusChip } from "@/components/ui/Primitives";

type ScenarioRow = {
  scenario: ScenarioDef;
  plant: PlantKpis;
  brother: MhrBreakup;
  partCost: number;
  quoteMarginPct: number | null;
  decisionProfit: number;
};

export function ScenarioCompareTable({
  rows,
  activeId,
  onApply,
}: {
  rows: ScenarioRow[];
  activeId: string;
  onApply: (id: ScenarioDef["id"]) => void;
}) {
  return (
    <div className="overflow-x-auto rounded border border-outline-variant">
      <table className="min-w-[980px] w-full text-left">
        <thead className="bg-surface-low">
          <tr className="border-b border-outline-variant text-body-sm text-on-surface-variant">
            <th className="sticky left-0 z-10 bg-surface-low px-4 py-3 font-medium">
              Metric
            </th>
            {rows.map((r) => (
              <th key={r.scenario.id} className="px-4 py-3 font-medium">
                <div className="flex min-w-[120px] flex-col gap-2">
                  <span className="text-on-surface">
                    {r.scenario.name}
                    {r.scenario.custom ? (
                      <span className="ml-1 text-code-sm text-primary">· custom</span>
                    ) : null}
                  </span>
                  {activeId === r.scenario.id ? (
                    <StatusChip status="Active" />
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => onApply(r.scenario.id)}
                    >
                      Apply
                    </Button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-body-sm">
          <MetricRow
            label="Cash MHR (cost)"
            values={rows.map(
              (r) => `${formatInr(r.brother.manufacturingMhr)}/hr`,
            )}
          />
          <MetricRow
            label="Selling MHR (workbook)"
            values={rows.map((r) => `${formatInr(r.brother.sellingMhr)}/hr`)}
          />
          <MetricRow
            label="Profit @ fixed selling"
            values={rows.map((r) => formatInr(r.decisionProfit))}
          />
          <MetricRow
            label="Capacity hours"
            values={rows.map((r) =>
              new Intl.NumberFormat("en-IN").format(
                Math.round(r.plant.capacityHours),
              ),
            )}
          />
          <MetricRow
            label="MID-3060 process cost"
            values={rows.map((r) => formatInr(r.partCost))}
          />
          <MetricRow
            label="Sample quote margin"
            values={rows.map((r) =>
              r.quoteMarginPct == null
                ? "—"
                : `${r.quoteMarginPct.toFixed(1)}%`,
            )}
          />
        </tbody>
      </table>
      <div className="grid gap-2 border-t border-outline-variant bg-surface-low p-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => (
          <p
            key={r.scenario.id}
            className="text-body-sm text-on-surface-variant"
          >
            <span className="font-medium text-on-surface">
              {r.scenario.name}:{" "}
            </span>
            {r.scenario.description}
          </p>
        ))}
      </div>
    </div>
  );
}

function MetricRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-b border-outline-variant/60">
      <td className="sticky left-0 bg-surface-lowest px-4 py-2.5 font-medium text-on-surface">
        {label}
      </td>
      {values.map((v, i) => (
        <td
          key={`${label}-${i}`}
          className="px-4 py-2.5 font-mono tabular-nums text-on-surface"
        >
          {v}
        </td>
      ))}
    </tr>
  );
}
