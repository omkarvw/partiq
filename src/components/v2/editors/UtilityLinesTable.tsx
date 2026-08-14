"use client";

import { Plus } from "lucide-react";
import { formatInr } from "@/lib/costing";
import {
  createUtilityLine,
  utilityLineAnnual,
  type V2UtilityLine,
  type V2UtilityLineMode,
} from "@/lib/v2/clientDb";
import { RemoveIconButton } from "@/components/v2/editors/EditorPrimitives";
import { V2SecondaryButton } from "@/components/v2/V2Ui";

/** Dense editable utility lines — shared by setup machines + Impact utilities. */
export function UtilityLinesTable({
  lines,
  workingDaysPerYear,
  onChange,
  /** When set, Add / Remove ask the parent to confirm apply scope first. */
  onRequestAdd,
  onRequestRemove,
}: {
  lines: V2UtilityLine[];
  workingDaysPerYear: number;
  onChange: (next: V2UtilityLine[]) => void;
  onRequestAdd?: (line: V2UtilityLine) => void;
  onRequestRemove?: (line: V2UtilityLine) => void;
}) {
  const days = workingDaysPerYear > 0 ? workingDaysPerYear : 365;

  function addCustom() {
    const line = createUtilityLine("Custom utility", "annual");
    if (onRequestAdd) onRequestAdd(line);
    else onChange([...lines, line]);
  }

  function removeLine(line: V2UtilityLine) {
    if (onRequestRemove) onRequestRemove(line);
    else onChange(lines.filter((l) => l.id !== line.id));
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-outline-variant">
        <table className="w-full min-w-[520px] text-left text-[12px]">
          <thead className="bg-info-container text-on-surface-variant">
            <tr>
              <th className="px-2 py-1.5 font-medium">Line</th>
              <th className="px-2 py-1.5 font-medium">Mode</th>
              <th className="px-2 py-1.5 font-medium">Qty / day</th>
              <th className="px-2 py-1.5 font-medium">₹ / unit</th>
              <th className="px-2 py-1.5 font-medium">₹ / year</th>
              <th className="w-10 px-1 py-1.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={line.id} className="border-t border-outline-variant/70">
                <td className="px-2 py-1">
                  <input
                    type="text"
                    aria-label="Utility name"
                    className="h-8 w-full min-w-[7rem] rounded-sm border border-outline-variant bg-surface px-1.5 text-body-sm"
                    value={line.name}
                    onChange={(e) => {
                      const next = lines.map((l, i) =>
                        i === idx ? { ...l, name: e.target.value } : l,
                      );
                      onChange(next);
                    }}
                  />
                </td>
                <td className="px-2 py-1">
                  <select
                    aria-label={`${line.name} mode`}
                    className="h-8 rounded-sm border border-outline-variant bg-surface px-1.5 text-body-sm"
                    value={line.mode}
                    onChange={(e) => {
                      const mode = e.target.value as V2UtilityLineMode;
                      const next = lines.map((l, i) =>
                        i === idx ? { ...l, mode } : l,
                      );
                      onChange(next);
                    }}
                  >
                    <option value="annual">Annual</option>
                    <option value="daily">Daily</option>
                  </select>
                </td>
                <td className="px-2 py-1">
                  {line.mode === "daily" ? (
                    <input
                      type="number"
                      step={0.1}
                      aria-label={`${line.name} qty per day`}
                      className="h-8 w-20 rounded-sm border border-outline-variant bg-surface px-1.5 font-mono text-body-sm"
                      value={line.qtyPerDay}
                      onChange={(e) => {
                        const next = lines.map((l, i) =>
                          i === idx
                            ? { ...l, qtyPerDay: Number(e.target.value) || 0 }
                            : l,
                        );
                        onChange(next);
                      }}
                    />
                  ) : (
                    <span className="text-on-surface-variant">—</span>
                  )}
                </td>
                <td className="px-2 py-1">
                  {line.mode === "daily" ? (
                    <input
                      type="number"
                      aria-label={`${line.name} rate per unit`}
                      className="h-8 w-24 rounded-sm border border-outline-variant bg-money-tint px-1.5 font-mono text-body-sm"
                      value={line.ratePerUnit}
                      onChange={(e) => {
                        const next = lines.map((l, i) =>
                          i === idx
                            ? {
                                ...l,
                                ratePerUnit: Number(e.target.value) || 0,
                              }
                            : l,
                        );
                        onChange(next);
                      }}
                    />
                  ) : (
                    <span className="text-on-surface-variant">—</span>
                  )}
                </td>
                <td className="px-2 py-1">
                  {line.mode === "annual" ? (
                    <input
                      type="number"
                      aria-label={`${line.name} amount per year`}
                      className="h-8 w-28 rounded-sm border border-outline-variant bg-money-tint px-1.5 font-mono text-body-sm"
                      value={line.annualAmount}
                      onChange={(e) => {
                        const next = lines.map((l, i) =>
                          i === idx
                            ? {
                                ...l,
                                annualAmount: Number(e.target.value) || 0,
                              }
                            : l,
                        );
                        onChange(next);
                      }}
                    />
                  ) : (
                    <span className="font-mono tabular-nums text-on-surface-variant">
                      {formatInr(utilityLineAnnual(line, days))}
                    </span>
                  )}
                </td>
                <td className="px-1 py-1">
                  <RemoveIconButton
                    label={`Remove ${line.name || "utility"}`}
                    onClick={() => removeLine(line)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <V2SecondaryButton type="button" onClick={addCustom}>
        <Plus className="mr-1 inline h-4 w-4" />
        Add custom utility
      </V2SecondaryButton>
    </div>
  );
}
