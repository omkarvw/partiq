"use client";

import type { ReactNode } from "react";
import { HrHint, Num } from "@/components/v2/editors/EditorPrimitives";
import { TypeLabourEditor } from "@/components/v2/editors/TypeLabourEditor";
import { UtilityLinesTable } from "@/components/v2/editors/UtilityLinesTable";
import type { MachineApplyScope } from "@/components/v2/ApplyMachineScopeDialog";
import { useApplyMachineStructure } from "@/components/v2/useApplyMachineStructure";
import { V2Field, V2Input } from "@/components/v2/V2Ui";
import {
  annualToPerHour,
  labourAnnualForMachine,
  machineOeeReadout,
  machineToolingAnnual,
  resolveToolingLines,
  statutoryLoadPct,
  clientRecordFromSnapshot,
  type V2BaselineSnapshot,
  type V2ClientRecord,
  type V2LabourRole,
  type V2MachineDraft,
  type V2Statutory,
  type V2UtilityLine,
} from "@/lib/v2/clientDb";
import { formatInr } from "@/lib/costing";

export const MACHINE_SECTIONS = [
  "calendar",
  "emi",
  "labour",
  "utility",
  "maintenance",
  "tooling",
] as const;

export type MachineSection = (typeof MACHINE_SECTIONS)[number];

/** Sub-tabs on Impact → Machines (labour edited here, not a separate Impact nav item). */
export const IMPACT_MACHINE_SECTIONS = [
  "calendar",
  "emi",
  "labour",
  "utility",
  "maintenance",
] as const;

function asRecord(
  ctx: V2ClientRecord | V2BaselineSnapshot,
): V2ClientRecord {
  if ("version" in ctx && typeof ctx.version === "number") {
    return ctx as V2ClientRecord;
  }
  return clientRecordFromSnapshot(ctx as V2BaselineSnapshot);
}

export function MachineSectionEditor({
  section,
  machine,
  hours,
  ctx,
  ohPerMachine,
  onChange,
  onUpsertLabourRole,
  onRemoveLabourRole,
  onStatutory,
  typePeerCount,
  onUtilityStructure,
}: {
  section: MachineSection;
  machine: V2MachineDraft;
  hours: number;
  ctx: V2ClientRecord | V2BaselineSnapshot;
  ohPerMachine: number;
  onChange: (m: V2MachineDraft) => void;
  /** When set, labour tab is editable (Impact / setup). */
  onUpsertLabourRole?: (role: V2LabourRole) => void;
  onRemoveLabourRole?: (id: string) => void;
  onStatutory?: (patch: Partial<V2Statutory>) => void;
  /** Peers of the same type including this machine (for scope confirm). */
  typePeerCount?: number;
  onUtilityStructure?: (
    action: { kind: "add" | "remove"; line: V2UtilityLine },
    scope: MachineApplyScope,
  ) => void;
}) {
  const record = asRecord(ctx);
  const patch = (p: Partial<V2MachineDraft>) => onChange({ ...machine, ...p });
  const oee = machineOeeReadout(machine);
  const labourYr = labourAnnualForMachine(machine, record);
  const toolingYr = machineToolingAnnual(machine, record.toolingProfiles);
  const { confirmStructure, dialog: structureDialog } =
    useApplyMachineStructure();
  const peerCount =
    typePeerCount ??
    record.machines.filter((m) => m.type === machine.type).length;

  function withDialog(node: ReactNode) {
    return (
      <>
        {node}
        {structureDialog}
      </>
    );
  }

  if (section === "calendar") {
    return withDialog(
      <div className="max-w-3xl space-y-2">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <Num
            label="Working days / month"
            value={machine.workingDaysPerMonth}
            required
            onChange={(v) => patch({ workingDaysPerMonth: v })}
          />
          <Num
            label="Working days / year"
            value={machine.workingDaysPerYear}
            required
            onChange={(v) => patch({ workingDaysPerYear: v })}
          />
          <Num
            label="Shifts / day"
            value={machine.shiftsPerDay}
            required
            onChange={(v) => patch({ shiftsPerDay: v })}
          />
          <Num
            label="Hours / shift"
            value={machine.hoursPerShift}
            required
            onChange={(v) => patch({ hoursPerShift: v })}
          />
          <Num
            label="Utilization %"
            value={machine.utilizationPct}
            required
            onChange={(v) => patch({ utilizationPct: v })}
          />
          <Num
            label="Performance %"
            value={machine.performancePct}
            onChange={(v) => patch({ performancePct: v })}
          />
          <Num
            label="Quality %"
            value={machine.qualityPct}
            onChange={(v) => patch({ qualityPct: v })}
          />
          <Num
            label="PM hours / yr"
            value={machine.plannedMaintHours}
            onChange={(v) => patch({ plannedMaintHours: v })}
          />
          <Num
            label="Breakdown hours / yr"
            value={machine.breakdownHours}
            onChange={(v) => patch({ breakdownHours: v })}
          />
          <Num
            label="Setup hours / yr"
            value={machine.setupHours}
            onChange={(v) => patch({ setupHours: v })}
          />
        </div>
        <div className="rounded bg-primary/5 px-2.5 py-2 text-[12px] text-on-surface">
          Available {oee.availableHoursYear.toFixed(0)} hrs · Net{" "}
          {oee.netAvailableHours.toFixed(0)} · OEE {oee.oeePct.toFixed(1)}% ·
          Productive {oee.productiveHoursYear.toFixed(0)} hrs/yr
        </div>
      </div>
    );
  }

  if (section === "emi") {
    const investment =
      machine.machineCost +
      machine.freight +
      machine.installation +
      machine.foundation +
      machine.accessories;
    return withDialog(
      <div className="grid gap-3 sm:grid-cols-3">
        <V2Field
          label="Name"
          required
          error={!machine.name.trim() ? "Required" : null}
        >
          <V2Input
            invalid={!machine.name.trim()}
            value={machine.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </V2Field>
        <Num
          label="Machine cost"
          value={machine.machineCost}
          required
          onChange={(v) => patch({ machineCost: v })}
        />
        <Num
          label="Freight"
          value={machine.freight}
          onChange={(v) => patch({ freight: v })}
        />
        <Num
          label="Installation"
          value={machine.installation}
          onChange={(v) => patch({ installation: v })}
        />
        <Num
          label="Foundation"
          value={machine.foundation}
          onChange={(v) => patch({ foundation: v })}
        />
        <Num
          label="Accessories"
          value={machine.accessories}
          onChange={(v) => patch({ accessories: v })}
        />
        <Num
          label="Interest %"
          value={machine.interestRatePct}
          step={0.25}
          onChange={(v) => patch({ interestRatePct: v })}
        />
        <Num
          label="Tenure (years)"
          value={machine.tenureYears}
          onChange={(v) => patch({ tenureYears: v })}
        />
        <Num
          label="Life (years)"
          value={machine.lifeYears}
          onChange={(v) => patch({ lifeYears: v })}
        />
        <Num
          label="Salvage %"
          value={machine.salvagePct}
          onChange={(v) => patch({ salvagePct: v })}
        />
        <div className="text-body-sm text-on-surface-variant">
          Investment {formatInr(investment)}
        </div>
      </div>,
    );
  }

  if (section === "labour") {
    const canEdit = Boolean(
      onUpsertLabourRole && onRemoveLabourRole && onStatutory,
    );
    const roles = record.labourByType[machine.type] ?? [];
    return withDialog(
      <div className="space-y-4">
        <div className="rounded-lg border border-outline-variant/60 bg-surface px-3 py-2">
          <p className="text-body-sm text-on-surface-variant">
            Labour for this machine (roles shared by all {machine.type}
            {peerCount > 1 ? ` · ${peerCount} machines` : ""}). Loaded with
            statutory {statutoryLoadPct(record.statutory).toFixed(1)}%.
          </p>
          <p className="mt-1 font-mono text-body-md text-on-surface">
            {formatInr(annualToPerHour(labourYr, hours))}/hr
            <span className="ml-2 text-body-sm text-on-surface-variant">
              ({formatInr(labourYr)}/yr)
            </span>
          </p>
        </div>
        {canEdit ? (
          <TypeLabourEditor
            type={machine.type}
            roles={roles}
            statutory={record.statutory}
            machineCount={peerCount || 1}
            onUpsert={(role) => {
              const isNew = !roles.some((r) => r.id === role.id);
              if (!isNew) {
                onUpsertLabourRole!(role);
                return;
              }
              confirmStructure({
                title: "Add labour role",
                body: `Labour roles are shared by type. Add “${role.name || "New role"}” for all ${machine.type} machines?`,
                machineName: machine.name,
                machineType: machine.type,
                typeCount: peerCount,
                allowMachineOnly: false,
                apply: () => onUpsertLabourRole!(role),
              });
            }}
            onRemove={(id) => {
              const name = roles.find((r) => r.id === id)?.name ?? "role";
              confirmStructure({
                title: "Remove labour role",
                body: `Remove “${name}” from all ${machine.type} machines?`,
                machineName: machine.name,
                machineType: machine.type,
                typeCount: peerCount,
                allowMachineOnly: false,
                apply: () => onRemoveLabourRole!(id),
              });
            }}
            onStatutory={onStatutory!}
          />
        ) : (
          <p className="text-body-sm text-on-surface-variant">
            Edit labour roles for {machine.type} in the type panel above.
          </p>
        )}
      </div>,
    );
  }

  if (section === "utility") {
    const lines = machine.utilityLines?.length
      ? machine.utilityLines
      : [];
    const otherYr = lines.reduce((s, line) => {
      if (line.mode === "daily") {
        const days =
          machine.workingDaysPerYear > 0 ? machine.workingDaysPerYear : 365;
        return s + line.qtyPerDay * line.ratePerUnit * days;
      }
      return s + line.annualAmount;
    }, 0);
    const elecYr =
      machine.powerKw * record.plant.electricityRatePerKwh * hours;

    function requestUtilityAdd(line: V2UtilityLine) {
      if (!onUtilityStructure) {
        patch({ utilityLines: [...lines, line] });
        return;
      }
      confirmStructure({
        title: "Add custom utility",
        body: `Add “${line.name || "Custom utility"}” to only ${machine.name}, or every ${machine.type}?`,
        machineName: machine.name,
        machineType: machine.type,
        typeCount: peerCount,
        apply: (scope) => onUtilityStructure({ kind: "add", line }, scope),
      });
    }

    function requestUtilityRemove(line: V2UtilityLine) {
      if (!onUtilityStructure) {
        patch({ utilityLines: lines.filter((l) => l.id !== line.id) });
        return;
      }
      confirmStructure({
        title: "Remove utility",
        body: `Remove “${line.name || "utility"}” from only ${machine.name}, or every ${machine.type}?`,
        machineName: machine.name,
        machineType: machine.type,
        typeCount: peerCount,
        apply: (scope) => onUtilityStructure({ kind: "remove", line }, scope),
      });
    }

    return withDialog(
      <div className="grid gap-3 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)] lg:items-start">
        <div className="rounded-md border border-l-[3px] border-outline-variant border-l-primary bg-surface-lowest p-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
            Power
          </p>
          <Num
            label="Connected load (kW)"
            value={machine.powerKw}
            step={0.5}
            required
            onChange={(v) => patch({ powerKw: v })}
          />
          <HrHint annual={elecYr} hours={hours} />
          <p className="mt-2 text-[11px] text-on-surface-variant">
            Tariff {formatInr(record.plant.electricityRatePerKwh)}/kWh
          </p>
        </div>
        <div className="min-w-0">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-info">
            Other utilities (air, coolant, oils…)
          </p>
          <UtilityLinesTable
            lines={lines}
            workingDaysPerYear={machine.workingDaysPerYear}
            onChange={(next) => patch({ utilityLines: next })}
            onRequestAdd={requestUtilityAdd}
            onRequestRemove={requestUtilityRemove}
          />
          <p className="mt-1.5 text-[12px] text-on-surface">
            Other ≈ {formatInr(annualToPerHour(otherYr, hours))}/hr · total
            utility ≈{" "}
            <span className="money-pop font-medium">
              {formatInr(annualToPerHour(elecYr + otherYr, hours))}/hr
            </span>
          </p>
        </div>
      </div>,
    );
  }

  if (section === "maintenance") {
    const amc = machine.maintenanceAmcAnnual ?? 0;
    const pm = machine.maintenancePmAnnual ?? 0;
    const spares = machine.maintenanceSparesAnnual ?? 0;
    const total = amc + pm + spares;
    return withDialog(
      <div className="max-w-2xl space-y-2 rounded-md border border-l-[3px] border-outline-variant border-l-on-surface bg-surface-lowest p-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
          Maintenance · Excel 08 (AMC + PM + spares)
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Num
            label="AMC ₹ / year"
            value={amc}
            onChange={(v) =>
              patch({
                maintenanceAmcAnnual: v,
                maintenanceAnnual: v + pm + spares,
              })
            }
          />
          <Num
            label="Preventive ₹ / year"
            value={pm}
            onChange={(v) =>
              patch({
                maintenancePmAnnual: v,
                maintenanceAnnual: amc + v + spares,
              })
            }
          />
          <Num
            label="Spares ₹ / year"
            value={spares}
            onChange={(v) =>
              patch({
                maintenanceSparesAnnual: v,
                maintenanceAnnual: amc + pm + v,
              })
            }
          />
        </div>
        <HrHint annual={total} hours={hours} />
        <p className="text-[11px] text-on-surface-variant">
          Total {formatInr(total)}/yr → Maint/hr. FO is separate (overhead
          step): {formatInr(annualToPerHour(ohPerMachine, hours))}/hr
        </p>
      </div>,
    );
  }

  const toolingLines = resolveToolingLines(machine, record.toolingProfiles);
  return withDialog(
    <div>
      <p className="mb-2 text-body-sm text-on-surface-variant">
        Using {machine.type} tooling profile (edit above). Override later if
        needed.
      </p>
      <ul className="mb-2 space-y-1 text-body-sm">
        {toolingLines.map((line) => (
          <li key={line.id} className="flex justify-between gap-2">
            <span>{line.name}</span>
            <span className="font-mono">
              {formatInr(annualToPerHour(line.amountAnnual, hours))}/hr
            </span>
          </li>
        ))}
      </ul>
      <p className="font-mono text-body-md">
        Tooling {formatInr(annualToPerHour(toolingYr, hours))}/hr
      </p>
    </div>,
  );
}
