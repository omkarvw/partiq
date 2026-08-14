"use client";

import { useMemo } from "react";
import {
  DataTable,
  TableCellInput,
  type PlantColumnDef,
} from "@/components/plant/DataTable";
import { V2SecondaryButton } from "@/components/v2/V2Ui";
import { RemoveIconButton } from "@/components/v2/editors/EditorPrimitives";
import {
  OVERHEAD_PEOPLE_SUGGESTIONS,
  createOverheadLine,
  type OhKind,
  type V2OhLine,
} from "@/lib/v2/clientDb";
import { formatInr } from "@/lib/costing";

function lineAnnual(line: V2OhLine) {
  if (line.kind === "people") return line.headcount * line.salaryPerMonth * 12;
  if (line.kind === "rent") return line.areaSqFt * line.rentPerSqFtMonth * 12;
  return line.amountAnnual;
}

export function OverheadEditor({
  lines,
  onUpsert,
  onRemove,
}: {
  lines: V2OhLine[];
  onUpsert: (line: V2OhLine) => void;
  onRemove: (id: string) => void;
}) {
  const columns = useMemo<PlantColumnDef<V2OhLine>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        size: 200,
        minSize: 140,
        cell: ({ row }) => {
          const line = row.original;
          return (
            <TableCellInput
              aria-label="Overhead name"
              value={line.name}
              onChange={(v) => onUpsert({ ...line, name: v })}
            />
          );
        },
      },
      {
        id: "kind",
        header: "Kind",
        size: 130,
        minSize: 110,
        cell: ({ row }) => {
          const line = row.original;
          return (
            <select
              aria-label="Overhead kind"
              className={`h-9 w-full min-w-0 rounded-sm border px-2 text-body-sm ${
                line.kind === "people"
                  ? "border-primary/40 bg-primary/5"
                  : line.kind === "rent"
                    ? "border-outline-variant bg-surface-low"
                    : "border-outline-variant bg-surface"
              }`}
              value={line.kind}
              onChange={(e) =>
                onUpsert({ ...line, kind: e.target.value as OhKind })
              }
            >
              <option value="people">People</option>
              <option value="rent">Rent</option>
              <option value="fixed_annual">Fixed / yr</option>
            </select>
          );
        },
      },
      {
        id: "a",
        header: "Headcount / Area / —",
        size: 140,
        minSize: 110,
        cell: ({ row }) => {
          const line = row.original;
          if (line.kind === "people") {
            return (
              <TableCellInput
                type="number"
                aria-label="Headcount"
                value={line.headcount}
                onChange={(v) =>
                  onUpsert({ ...line, headcount: Number(v) || 0 })
                }
              />
            );
          }
          if (line.kind === "rent") {
            return (
              <TableCellInput
                type="number"
                aria-label="Area sq ft"
                value={line.areaSqFt}
                onChange={(v) =>
                  onUpsert({ ...line, areaSqFt: Number(v) || 0 })
                }
              />
            );
          }
          return (
            <span className="text-body-sm text-on-surface-variant">—</span>
          );
        },
      },
      {
        id: "b",
        header: "Salary/mo · Rent/sqft · ₹/yr",
        size: 160,
        minSize: 130,
        cell: ({ row }) => {
          const line = row.original;
          if (line.kind === "people") {
            return (
              <TableCellInput
                type="number"
                aria-label="Salary per month"
                value={line.salaryPerMonth}
                onChange={(v) =>
                  onUpsert({ ...line, salaryPerMonth: Number(v) || 0 })
                }
              />
            );
          }
          if (line.kind === "rent") {
            return (
              <TableCellInput
                type="number"
                aria-label="Rent per sq ft per month"
                value={line.rentPerSqFtMonth}
                onChange={(v) =>
                  onUpsert({ ...line, rentPerSqFtMonth: Number(v) || 0 })
                }
              />
            );
          }
          return (
            <TableCellInput
              type="number"
              aria-label="Amount per year"
              value={line.amountAnnual}
              onChange={(v) =>
                onUpsert({ ...line, amountAnnual: Number(v) || 0 })
              }
            />
          );
        },
      },
      {
        id: "annual",
        header: "₹ / year",
        size: 120,
        minSize: 100,
        cell: ({ row }) => (
          <span className="font-mono text-body-sm tabular-nums text-on-surface">
            {formatInr(lineAnnual(row.original))}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 48,
        minSize: 44,
        cell: ({ row }) => (
          <RemoveIconButton
            label={`Remove ${row.original.name || "overhead"}`}
            onClick={() => onRemove(row.original.id)}
          />
        ),
      },
    ],
    [onUpsert, onRemove],
  );

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {OVERHEAD_PEOPLE_SUGGESTIONS.slice(0, 6).map((sug) => (
          <V2SecondaryButton
            key={sug.name}
            type="button"
            onClick={() =>
              onUpsert(createOverheadLine(sug.name, "people", sug))
            }
          >
            + {sug.name}
          </V2SecondaryButton>
        ))}
        <V2SecondaryButton
          type="button"
          onClick={() =>
            onUpsert(createOverheadLine("Fixed annual", "fixed_annual"))
          }
        >
          + Fixed annual
        </V2SecondaryButton>
        <V2SecondaryButton
          type="button"
          onClick={() =>
            onUpsert(createOverheadLine("Custom overhead", "fixed_annual"))
          }
        >
          + Custom
        </V2SecondaryButton>
      </div>
      <p className="text-[11px] text-on-surface-variant">
        Use <span className="font-medium text-on-surface">+ Custom</span> for
        any line — rename it and switch Kind (People / Rent / Fixed).
      </p>
      <DataTable
        dense
        data={lines}
        columns={columns}
        getRowId={(row) => row.id}
        minWidth={720}
        empty="No overhead lines yet."
      />
    </div>
  );
}
