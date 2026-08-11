"use client";

import { Num } from "@/components/v2/editors/EditorPrimitives";
import { V2Field, V2Input, V2SecondaryButton } from "@/components/v2/V2Ui";
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
}: {
  type: string;
  roles: V2LabourRole[];
  statutory: V2Statutory;
  machineCount: number;
  onUpsert: (role: V2LabourRole) => void;
  onRemove: (id: string) => void;
  onStatutory: (patch: Partial<V2Statutory>) => void;
}) {
  return (
    <div className="rounded border border-dashed border-outline-variant p-3">
      <p className="mb-2 text-body-sm font-medium">Labour roles for {type}</p>
      <div className="mb-3 grid gap-2 sm:grid-cols-5">
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
      <div className="mb-2 flex flex-wrap gap-2">
        {LABOUR_ROLE_SUGGESTIONS.map((sug) => (
          <V2SecondaryButton
            key={sug.name}
            type="button"
            onClick={() => onUpsert(createLabourRole(sug.name, sug))}
          >
            + {sug.name}
          </V2SecondaryButton>
        ))}
      </div>
      {roles.map((role) => (
        <div
          key={role.id}
          className="mb-2 grid gap-2 rounded bg-surface-lowest p-2 sm:grid-cols-4"
        >
          <V2Field label="Role">
            <V2Input
              value={role.name}
              onChange={(e) => onUpsert({ ...role, name: e.target.value })}
            />
          </V2Field>
          {role.payBasis === "monthly" ? (
            <Num
              label="Salary / mo"
              value={role.monthlySalary}
              onChange={(v) => onUpsert({ ...role, monthlySalary: v })}
            />
          ) : (
            <Num
              label="Day rate (8h)"
              value={role.dayRateFor8h}
              onChange={(v) => onUpsert({ ...role, dayRateFor8h: v })}
            />
          )}
          <Num
            label="Machines / head"
            value={role.machinesPerHead}
            onChange={(v) => onUpsert({ ...role, machinesPerHead: v })}
          />
          <div className="flex items-end">
            <button
              type="button"
              className="text-body-sm text-error"
              onClick={() => onRemove(role.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <p className="text-body-sm text-on-surface-variant">
        {machineCount === 0
          ? "No machines of this type yet — add one below."
          : `Allocated across ${machineCount} ${type} machine(s).`}
      </p>
    </div>
  );
}
