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
  createEmptyMaterialGrade,
  type V2MaterialGrade,
} from "@/lib/v2/clientDb";
import { formatInr } from "@/lib/costing";

export function MaterialGradesEditor({
  grades,
  onUpsert,
  onRemove,
}: {
  grades: V2MaterialGrade[];
  onUpsert: (grade: V2MaterialGrade) => void;
  onRemove: (id: string) => void;
}) {
  const columns = useMemo<PlantColumnDef<V2MaterialGrade>[]>(
    () => [
      {
        id: "name",
        header: "Grade",
        size: 200,
        minSize: 140,
        cell: ({ row }) => (
          <TableCellInput
            aria-label="Grade name"
            value={row.original.name}
            onChange={(v) => onUpsert({ ...row.original, name: v })}
          />
        ),
      },
      {
        id: "raw",
        header: "Raw ₹/kg",
        size: 130,
        minSize: 110,
        cell: ({ row }) => (
          <TableCellInput
            type="number"
            aria-label="Raw rate per kg"
            value={row.original.rawRatePerKg}
            onChange={(v) =>
              onUpsert({
                ...row.original,
                rawRatePerKg: Number(v) || 0,
              })
            }
          />
        ),
      },
      {
        id: "scrap",
        header: "Scrap ₹/kg",
        size: 130,
        minSize: 110,
        cell: ({ row }) => (
          <TableCellInput
            type="number"
            aria-label="Scrap rate per kg"
            value={row.original.scrapRatePerKg}
            onChange={(v) =>
              onUpsert({
                ...row.original,
                scrapRatePerKg: Number(v) || 0,
              })
            }
          />
        ),
      },
      {
        id: "hint",
        header: "Net example",
        size: 160,
        minSize: 130,
        cell: ({ row }) => {
          const g = row.original;
          const sample =
            1 * g.rawRatePerKg - Math.max(0, 1 - 0.7) * g.scrapRatePerKg;
          return (
            <span className="font-mono text-code-sm tabular-nums text-on-surface-variant">
              ~{formatInr(sample)} / 1→0.7 kg
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 48,
        minSize: 44,
        maxSize: 52,
        cell: ({ row }) => (
          <RemoveIconButton
            label={`Remove ${row.original.name}`}
            onClick={() => onRemove(row.original.id)}
          />
        ),
      },
    ],
    [onRemove, onUpsert],
  );

  return (
    <div className="space-y-3">
      <DataTable
        data={grades}
        columns={columns}
        getRowId={(row) => row.id}
        dense
        minWidth={720}
        empty="No material grades yet. Add steel / aluminium rates here."
      />
      <V2SecondaryButton
        type="button"
        onClick={() => onUpsert(createEmptyMaterialGrade())}
      >
        Add grade
      </V2SecondaryButton>
    </div>
  );
}
