"use client";

import { useMemo } from "react";
import {
  DataTable,
  TableCellInput,
  type PlantColumnDef,
} from "@/components/plant/DataTable";
import { CollapsibleBlock, Num, RemoveIconButton } from "@/components/v2/editors/EditorPrimitives";
import { V2SecondaryButton } from "@/components/v2/V2Ui";
import {
  LABOUR_ROLE_SUGGESTIONS,
  createLabourRole,
  type V2LabourRole,
  type V2Statutory,
} from "@/lib/v2/clientDb";

export function TypeLabourEditor({
  type,
  roles,
  statutory,
  machineCount,
  onUpsert,
  onRemove,
  onStatutory,
  defaultOpen = true,
}: {
  type: string;
  roles: V2LabourRole[];
  statutory: V2Statutory;
  machineCount: number;
  onUpsert: (role: V2LabourRole) => void;
  onRemove: (id: string) => void;
  onStatutory: (patch: Partial<V2Statutory>) => void;
  defaultOpen?: boolean;
}) {
  const columns = useMemo<PlantColumnDef<V2LabourRole>[]>(
    () => [
      {
        id: "name",
        header: "Role",
        size: 180,
        minSize: 140,
        cell: ({ row }) => {
          const role = row.original;
          return (
            <TableCellInput
              aria-label="Role"
              value={role.name}
              onChange={(v) => onUpsert({ ...role, name: v })}
            />
          );
        },
      },
      {
        id: "pay",
        header: "Pay",
        size: 150,
        minSize: 120,
        cell: ({ row }) => {
          const role = row.original;
          if (role.payBasis === "monthly") {
            return (
              <TableCellInput
                type="number"
                aria-label="Salary per month"
                className="bg-surface-low/50 font-mono"
                value={role.monthlySalary}
                onChange={(v) =>
                  onUpsert({ ...role, monthlySalary: Number(v) || 0 })
                }
              />
            );
          }
          return (
            <TableCellInput
              type="number"
              aria-label="Day rate for 8h"
              className="bg-surface-low/50 font-mono"
              value={role.dayRateFor8h}
              onChange={(v) =>
                onUpsert({ ...role, dayRateFor8h: Number(v) || 0 })
              }
            />
          );
        },
      },
      {
        id: "payBasis",
        header: "Basis",
        size: 120,
        minSize: 100,
        cell: ({ row }) => {
          const role = row.original;
          return (
            <select
              aria-label="Pay basis"
              className="h-9 w-full min-w-0 rounded-sm border border-outline-variant bg-surface px-2 text-body-sm"
              value={role.payBasis}
              onChange={(e) =>
                onUpsert({
                  ...role,
                  payBasis: e.target.value as V2LabourRole["payBasis"],
                })
              }
            >
              <option value="monthly">₹ / mo</option>
              <option value="day_for_8h">₹ / day</option>
            </select>
          );
        },
      },
      {
        id: "machinesPerHead",
        header: "Machines / head",
        size: 130,
        minSize: 110,
        cell: ({ row }) => {
          const role = row.original;
          return (
            <TableCellInput
              type="number"
              aria-label="Machines per head"
              className="font-mono"
              value={role.machinesPerHead}
              step={0.1}
              onChange={(v) =>
                onUpsert({ ...role, machinesPerHead: Number(v) || 0 })
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
            label={`Remove ${row.original.name || "role"}`}
            onClick={() => onRemove(row.original.id)}
          />
        ),
      },
    ],
    [onUpsert, onRemove],
  );

  return (
    <CollapsibleBlock
      accent="labour"
      defaultOpen={defaultOpen}
      title={`Labour · ${type}`}
      subtitle={
        machineCount === 0
          ? "No machines of this type yet — add one below."
          : `${roles.length} role(s) · across ${machineCount} ${type}`
      }
      headerRight={
        <>
          {LABOUR_ROLE_SUGGESTIONS.map((sug) => (
            <V2SecondaryButton
              key={sug.name}
              type="button"
              onClick={() => onUpsert(createLabourRole(sug.name, sug))}
            >
              + {sug.name}
            </V2SecondaryButton>
          ))}
        </>
      }
    >
      <div className="rounded-md bg-surface-low/70 px-2.5 py-2">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
          Statutory loads (plant-wide)
        </p>
        <div className="grid gap-2 sm:grid-cols-5">
          {(
            [
              ["pfPct", "PF %"],
              ["esicPct", "ESIC %"],
              ["bonusPct", "Bonus %"],
              ["gratuityPct", "Gratuity %"],
              ["leaveReservePct", "Leave %"],
            ] as const
          ).map(([key, label]) => (
            <Num
              key={key}
              label={label}
              value={statutory[key]}
              step={0.01}
              onChange={(v) => onStatutory({ [key]: v })}
            />
          ))}
        </div>
      </div>

      <DataTable
        dense
        data={roles}
        columns={columns}
        getRowId={(row) => row.id}
        minWidth={640}
        empty="No labour roles yet — add Operator, Helper, or another role."
      />
    </CollapsibleBlock>
  );
}
