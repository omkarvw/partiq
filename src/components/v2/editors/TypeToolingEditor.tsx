"use client";

import { useMemo } from "react";
import {
  DataTable,
  TableCellInput,
  type PlantColumnDef,
} from "@/components/plant/DataTable";
import { CollapsibleBlock, RemoveIconButton } from "@/components/v2/editors/EditorPrimitives";
import { V2SecondaryButton } from "@/components/v2/V2Ui";
import { toolingAnnual, type V2ToolingLine } from "@/lib/v2/clientDb";
import { formatInr } from "@/lib/costing";

function toolingColumns(
  onUpsert: (line: V2ToolingLine) => void,
  onRemove: (id: string) => void,
): PlantColumnDef<V2ToolingLine>[] {
  return [
    {
      id: "name",
      header: "Line",
      size: 420,
      minSize: 180,
      cell: ({ row }) => {
        const line = row.original;
        return (
          <TableCellInput
            aria-label="Tooling line"
            value={line.name}
            onChange={(v) => onUpsert({ ...line, name: v })}
          />
        );
      },
    },
    {
      id: "amount",
      header: "₹ / year",
      size: 140,
      minSize: 110,
      cell: ({ row }) => {
        const line = row.original;
        return (
          <TableCellInput
            type="number"
            aria-label="Amount per year"
            className="bg-money-tint font-mono"
            value={line.amountAnnual}
            onChange={(v) =>
              onUpsert({ ...line, amountAnnual: Number(v) || 0 })
            }
          />
        );
      },
    },
    {
      id: "actions",
      header: "",
      size: 48,
      minSize: 44,
      cell: ({ row }) => (
        <RemoveIconButton
          label={`Remove ${row.original.name || "line"}`}
          onClick={() => onRemove(row.original.id)}
        />
      ),
    },
  ];
}

function ToolingLinesTable({
  lines,
  columns,
}: {
  lines: V2ToolingLine[];
  columns: PlantColumnDef<V2ToolingLine>[];
}) {
  return (
    <DataTable
      dense
      data={lines}
      columns={columns}
      getRowId={(row) => row.id}
      minWidth={480}
      empty="No tooling lines yet."
    />
  );
}

export function TypeToolingEditor({
  type,
  lines,
  onUpsert,
  onRemove,
  defaultOpen = true,
}: {
  type: string;
  lines: V2ToolingLine[];
  onUpsert: (line: V2ToolingLine) => void;
  onRemove: (id: string) => void;
  defaultOpen?: boolean;
}) {
  const columns = useMemo(
    () => toolingColumns(onUpsert, onRemove),
    [onUpsert, onRemove],
  );

  const split = lines.length > 4;
  const mid = Math.ceil(lines.length / 2);
  const left = split ? lines.slice(0, mid) : lines;
  const right = split ? lines.slice(mid) : [];

  return (
    <CollapsibleBlock
      accent="tooling"
      defaultOpen={defaultOpen}
      title={`Tooling · ${type}`}
      subtitle={
        <span className="money-pop font-medium">
          {formatInr(toolingAnnual(lines))}/yr total
        </span>
      }
      headerRight={
        <V2SecondaryButton
          type="button"
          onClick={() =>
            onUpsert({
              id: `tool-${Date.now()}`,
              name: "New tooling line",
              amountAnnual: 0,
            })
          }
        >
          Add line
        </V2SecondaryButton>
      }
    >
      {split ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <ToolingLinesTable lines={left} columns={columns} />
          <ToolingLinesTable lines={right} columns={columns} />
        </div>
      ) : (
        <ToolingLinesTable lines={left} columns={columns} />
      )}
    </CollapsibleBlock>
  );
}
