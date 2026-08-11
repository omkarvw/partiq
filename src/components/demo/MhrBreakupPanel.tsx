"use client";

import { formatInr } from "@/lib/costing";
import type { MhrBreakup } from "@/lib/factory/types";

type Row = {
  id: string;
  label: string;
  value: number;
  share?: number;
  memo?: boolean;
};

export function MhrBreakupPanel({
  breakup,
  onSelect,
  selectedId,
  cashOnly = false,
}: {
  breakup: MhrBreakup;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  /** Hide selling / profit rows (V2 Cash MHR focus). */
  cashOnly?: boolean;
}) {
  const rows: Row[] = [
    {
      id: "dep-hr",
      label: "Depreciation / Hour",
      value: breakup.depreciationPerHour,
      memo: true,
    },
    {
      id: "emi-hr",
      label: "EMI / Hour",
      value: breakup.emiPerHour,
      share: breakup.emiPerHour / breakup.manufacturingMhr,
    },
    {
      id: "labour-hr",
      label: "Labour / Hour",
      value: breakup.labourPerHour,
      share: breakup.labourPerHour / breakup.manufacturingMhr,
    },
    {
      id: "utility-hr",
      label: "Utility + Power / Hour",
      value: breakup.utilityPerHour,
      share: breakup.utilityPerHour / breakup.manufacturingMhr,
    },
    {
      id: "maint-hr",
      label: "Maintenance / Hour",
      value: breakup.maintenancePerHour,
      share: breakup.maintenancePerHour / breakup.manufacturingMhr,
    },
    {
      id: "oh-hr",
      label: "Factory Overhead / Hour",
      value: breakup.ohPerHour,
      share: breakup.ohPerHour / breakup.manufacturingMhr,
    },
    {
      id: "tooling-hr",
      label: "Tooling / Hour",
      value: breakup.toolingPerHour,
      share: breakup.toolingPerHour / breakup.manufacturingMhr,
    },
  ];

  return (
    <div className="overflow-hidden rounded border border-outline-variant">
      <table className="w-full text-left">
        <thead className="bg-surface-low">
          <tr className="border-b border-outline-variant text-body-sm text-on-surface-variant">
            <th className="px-4 py-2 font-medium">Cost head</th>
            <th className="px-4 py-2 font-medium text-right">₹ / hr</th>
            <th className="px-4 py-2 font-medium text-right">Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const active = selectedId === row.id;
            return (
              <tr
                key={row.id}
                className={`border-b border-outline-variant/60 ${
                  onSelect ? "cursor-pointer hover:bg-surface-low/80" : ""
                } ${active ? "bg-primary/5" : ""}`}
                onClick={() => onSelect?.(row.id)}
              >
                <td className="px-4 py-2.5 text-body-sm text-on-surface">
                  {row.label}
                  {row.memo ? (
                    <span className="ml-2 label-caps text-on-surface-variant">
                      memo · excl. from cash MHR
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-body-sm text-on-surface">
                  {formatInr(row.value)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-body-sm text-on-surface-variant">
                  {row.share != null
                    ? `${(row.share * 100).toFixed(1)}%`
                    : "—"}
                </td>
              </tr>
            );
          })}
          <tr className="bg-surface-low font-medium">
            <td className="px-4 py-3 text-body-sm text-on-surface">
              Manufacturing MHR (cash)
            </td>
            <td className="px-4 py-3 text-right font-mono tabular-nums text-body-sm text-primary">
              {formatInr(breakup.manufacturingMhr)}
            </td>
            <td className="px-4 py-3 text-right text-body-sm text-on-surface-variant">
              100%
            </td>
          </tr>
          {!cashOnly ? (
            <>
              <tr>
                <td className="px-4 py-2.5 text-body-sm text-on-surface">
                  Profit / Hour
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-body-sm">
                  {formatInr(breakup.profitPerHour)}
                </td>
                <td className="px-4 py-2.5" />
              </tr>
              <tr className="bg-primary/5">
                <td className="px-4 py-3 text-body-sm font-semibold text-on-surface">
                  Selling MHR
                </td>
                <td className="px-4 py-3 text-right font-mono text-headline-sm tabular-nums text-primary">
                  {formatInr(breakup.sellingMhr)}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
