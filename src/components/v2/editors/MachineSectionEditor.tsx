"use client";

import { HrHint, Num } from "@/components/v2/editors/EditorPrimitives";
import { TypeLabourEditor } from "@/components/v2/editors/TypeLabourEditor";
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
}) {
  const record = asRecord(ctx);
  const patch = (p: Partial<V2MachineDraft>) => onChange({ ...machine, ...p });
  const oee = machineOeeReadout(machine);
  const labourYr = labourAnnualForMachine(machine, record);
  const toolingYr = machineToolingAnnual(machine, record.toolingProfiles);

  if (section === "calendar") {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
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
        <div className="rounded bg-primary/5 px-3 py-2 text-body-sm text-on-surface">
          Available {oee.availableHoursYear.toFixed(0)} hrs · Net{" "}
          {oee.netAvailableHours.toFixed(0)} · Availability{" "}
          {(
            oee.availableHoursYear > 0
              ? (oee.netAvailableHours / oee.availableHoursYear) * 100
              : 0
          ).toFixed(1)}
          % · OEE {oee.oeePct.toFixed(1)}% · Productive{" "}
          {oee.productiveHoursYear.toFixed(0)} hrs/yr (
          {oee.productiveHoursDay.toFixed(1)} / day)
          <br />
          <span className="text-on-surface-variant">
            Cash MHR uses productive hours (net × utilization). Perf/Quality
            feed OEE display only.
          </span>
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
    return (
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
      </div>
    );
  }

  if (section === "labour") {
    const typeCount = record.machines.filter((m) => m.type === machine.type)
      .length;
    const canEdit = Boolean(onUpsertLabourRole && onRemoveLabourRole && onStatutory);
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-outline-variant/60 bg-surface px-3 py-2">
          <p className="text-body-sm text-on-surface-variant">
            Labour for this machine (roles shared by all {machine.type}
            {typeCount > 1 ? ` · ${typeCount} machines` : ""}). Loaded with
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
            roles={record.labourByType[machine.type] ?? []}
            statutory={record.statutory}
            machineCount={typeCount || 1}
            onUpsert={onUpsertLabourRole!}
            onRemove={onRemoveLabourRole!}
            onStatutory={onStatutory!}
          />
        ) : (
          <p className="text-body-sm text-on-surface-variant">
            Edit labour roles for {machine.type} in the type panel above.
          </p>
        )}
      </div>
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
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Num
              label="Connected load (kW)"
              value={machine.powerKw}
              step={0.5}
              required
              onChange={(v) => patch({ powerKw: v })}
            />
            <HrHint annual={elecYr} hours={hours} />
          </div>
          <p className="self-end text-body-sm text-on-surface">
            Power ≈{" "}
            {formatInr(annualToPerHour(elecYr, hours))}
            /hr · electricity {formatInr(record.plant.electricityRatePerKwh)}
            /kWh
          </p>
        </div>
        <div>
          <p className="mb-2 text-body-sm font-medium text-on-surface">
            Other utilities (air, coolant, oils…)
          </p>
          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div
                key={line.id}
                className="grid gap-2 rounded-lg border border-outline-variant/70 p-3 sm:grid-cols-4"
              >
                <p className="sm:col-span-4 text-body-sm font-medium text-on-surface">
                  {line.name}
                </p>
                {line.mode === "annual" ? (
                  <div className="sm:col-span-2">
                    <Num
                      label="₹ / year"
                      value={line.annualAmount}
                      onChange={(v) => {
                        const next = lines.map((l, i) =>
                          i === idx ? { ...l, annualAmount: v } : l,
                        );
                        patch({ utilityLines: next });
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <Num
                      label="Qty / day"
                      value={line.qtyPerDay}
                      step={0.1}
                      onChange={(v) => {
                        const next = lines.map((l, i) =>
                          i === idx ? { ...l, qtyPerDay: v } : l,
                        );
                        patch({ utilityLines: next });
                      }}
                    />
                    <Num
                      label="₹ / unit"
                      value={line.ratePerUnit}
                      onChange={(v) => {
                        const next = lines.map((l, i) =>
                          i === idx ? { ...l, ratePerUnit: v } : l,
                        );
                        patch({ utilityLines: next });
                      }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-body-sm text-on-surface">
            Other utility ≈ {formatInr(annualToPerHour(otherYr, hours))}/hr ·
            total utility ≈{" "}
            {formatInr(annualToPerHour(elecYr + otherYr, hours))}/hr
          </p>
        </div>
      </div>
    );
  }

  if (section === "maintenance") {
    return (
      <div>
        <Num
          label="Maintenance ₹ / year"
          value={machine.maintenanceAnnual}
          onChange={(v) => patch({ maintenanceAnnual: v })}
        />
        <HrHint annual={machine.maintenanceAnnual} hours={hours} />
        <p className="mt-2 text-body-sm text-on-surface-variant">
          FO allocation (plant ÷ N):{" "}
          {formatInr(annualToPerHour(ohPerMachine, hours))}/hr — entered on
          Factory overhead step.
        </p>
      </div>
    );
  }

  const lines = resolveToolingLines(machine, record.toolingProfiles);
  return (
    <div>
      <p className="mb-2 text-body-sm text-on-surface-variant">
        Using {machine.type} tooling profile (edit above). Override later if
        needed.
      </p>
      <ul className="mb-2 space-y-1 text-body-sm">
        {lines.map((line) => (
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
    </div>
  );
}
