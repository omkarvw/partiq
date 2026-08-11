"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  V2Field,
  V2Input,
  V2PrimaryButton,
  V2SecondaryButton,
  V2Select,
} from "@/components/v2/V2Ui";
import { Num } from "@/components/v2/editors/EditorPrimitives";
import {
  createLabourRole,
  defaultLabourRoles,
  defaultMachineCalendar,
  LABOUR_ROLE_SUGGESTIONS,
  type V2LabourRole,
  type V2MachineDraft,
  type V2Section,
} from "@/lib/v2/clientDb";

const COMMON_TYPES = ["VMC", "CNC Lathe", "HMC", "Grinder", "EDM"];

const STEPS = [
  { id: "who", label: "This machine" },
  { id: "labour", label: "Crew / labour" },
  { id: "cost", label: "Cost on this machine" },
] as const;

export type AddMachinePayload = {
  name: string;
  type: string;
  sectionId: string | null;
  labourRoles: V2LabourRole[];
  machine: Partial<V2MachineDraft>;
};

function cloneRoles(roles: V2LabourRole[]): V2LabourRole[] {
  return roles.map((role) => ({ ...role }));
}

function rolesForType(
  type: string,
  labourByType: Record<string, V2LabourRole[]>,
): V2LabourRole[] {
  const existing = labourByType[type];
  if (existing?.length) return cloneRoles(existing);
  return defaultLabourRoles().map((role) => ({
    ...role,
    id: `role-${type}-${role.name.toLowerCase().replaceAll(" ", "-")}`,
  }));
}

export function AddMachineModal({
  open,
  onClose,
  onAdd,
  types,
  sections,
  labourByType = {},
  typeCounts = {},
  defaultSectionId,
  title = "Add machine",
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (payload: AddMachinePayload) => void;
  types: string[];
  sections: V2Section[];
  labourByType?: Record<string, V2LabourRole[]>;
  typeCounts?: Record<string, number>;
  defaultSectionId?: string | null;
  title?: string;
}) {
  const typeOptions = useMemo(
    () => Array.from(new Set([...COMMON_TYPES, ...types])).filter(Boolean),
    [types],
  );
  const cal = defaultMachineCalendar();
  const [step, setStep] = useState(0);
  const [type, setType] = useState(typeOptions[0] ?? "VMC");
  const [customType, setCustomType] = useState("");
  const [name, setName] = useState("");
  const [sectionId, setSectionId] = useState(defaultSectionId ?? "");
  const [roles, setRoles] = useState<V2LabourRole[]>([]);
  const [workingDaysPerYear, setWorkingDaysPerYear] = useState(
    cal.workingDaysPerYear,
  );
  const [shiftsPerDay, setShiftsPerDay] = useState(cal.shiftsPerDay);
  const [hoursPerShift, setHoursPerShift] = useState(cal.hoursPerShift);
  const [utilizationPct, setUtilizationPct] = useState(cal.utilizationPct);
  const [machineCost, setMachineCost] = useState(0);
  const [interestRatePct, setInterestRatePct] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(5);
  const [powerKw, setPowerKw] = useState(10);
  const [maintenanceAnnual, setMaintenanceAnnual] = useState(0);

  const resolvedType = customType.trim() || type.trim() || "VMC";

  useEffect(() => {
    if (!open) return;
    const calendar = defaultMachineCalendar();
    const initialType = typeOptions[0] ?? "VMC";
    setStep(0);
    setType(initialType);
    setCustomType("");
    setName("");
    setSectionId(defaultSectionId ?? sections[0]?.id ?? "");
    setWorkingDaysPerYear(calendar.workingDaysPerYear);
    setShiftsPerDay(calendar.shiftsPerDay);
    setHoursPerShift(calendar.hoursPerShift);
    setUtilizationPct(calendar.utilizationPct);
    setMachineCost(0);
    setInterestRatePct(8.5);
    setTenureYears(5);
    setPowerKw(initialType === "VMC" ? 10 : 7.5);
    setMaintenanceAnnual(0);
    setRoles(rolesForType(initialType, labourByType));
    // Intentionally only when the dialog opens — not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setRoles(rolesForType(resolvedType, labourByType));
    setPowerKw(resolvedType === "VMC" ? 10 : 7.5);
  }, [resolvedType]);

  if (!open) return null;

  const existingOfType = typeCounts[resolvedType] ?? 0;

  function upsertRole(role: V2LabourRole) {
    setRoles((prev) => {
      const hit = prev.some((r) => r.id === role.id);
      return hit
        ? prev.map((r) => (r.id === role.id ? role : r))
        : [...prev, role];
    });
  }

  function submit() {
    onAdd({
      name: name.trim(),
      type: resolvedType,
      sectionId: sectionId || null,
      labourRoles: roles,
      machine: {
        workingDaysPerYear,
        workingDaysPerMonth: Math.max(1, Math.round(workingDaysPerYear / 12)),
        shiftsPerDay,
        hoursPerShift,
        utilizationPct,
        machineCost,
        interestRatePct,
        tenureYears,
        powerKw,
        maintenanceAnnual,
      },
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-labelledby="add-machine-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-outline-variant bg-surface-lowest shadow-industrial"
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <div>
            <h2
              id="add-machine-title"
              className="text-headline-sm text-on-surface"
            >
              {title}
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-on-surface-variant">
              {STEPS.map((s, i) => (
                <span key={s.id}>
                  {i > 0 ? " · " : ""}
                  <span
                    className={
                      i === step ? "text-on-surface" : "text-on-surface-variant"
                    }
                  >
                    {i + 1} {s.label}
                  </span>
                </span>
              ))}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="cursor-pointer rounded-sm p-1 text-on-surface-variant hover:text-on-surface"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {step === 0 ? (
            <div className="space-y-4">
              <V2Field label="Machine type" required>
                <V2Select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </V2Select>
              </V2Field>
              <V2Field
                label="Or type a new kind"
                hint="Leave blank to use the list above"
              >
                <V2Input
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="e.g. Surface grinder"
                />
              </V2Field>
              <V2Field
                label="Name"
                hint="Optional — we can name it from the type"
              >
                <V2Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`${resolvedType} …`}
                />
              </V2Field>
              {sections.length > 0 ? (
                <V2Field label="Section">
                  <V2Select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </V2Select>
                </V2Field>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-3">
              <p className="text-body-sm text-on-surface-variant">
                Labour is by machine type — every {resolvedType} shares this
                crew. PF / ESIC stay on the plant.
                {existingOfType > 0
                  ? ` You already have ${existingOfType} ${resolvedType}${existingOfType === 1 ? "" : "s"}; changing pay here updates all of them.`
                  : " This is a new type, so set the crew now."}
              </p>
              <div className="flex flex-wrap gap-2">
                {LABOUR_ROLE_SUGGESTIONS.map((sug) => (
                  <V2SecondaryButton
                    key={sug.name}
                    type="button"
                    onClick={() =>
                      upsertRole(createLabourRole(sug.name, sug))
                    }
                  >
                    + {sug.name}
                  </V2SecondaryButton>
                ))}
              </div>
              {roles.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">
                  No roles yet — add operator / helper or skip and fill later
                  in Impact.
                </p>
              ) : null}
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="grid gap-2 rounded-lg border border-outline-variant/70 bg-surface p-3 sm:grid-cols-4"
                >
                  <V2Field label="Role">
                    <V2Input
                      value={role.name}
                      onChange={(e) =>
                        upsertRole({ ...role, name: e.target.value })
                      }
                    />
                  </V2Field>
                  {role.payBasis === "monthly" ? (
                    <Num
                      label="Salary / mo"
                      value={role.monthlySalary}
                      onChange={(v) =>
                        upsertRole({ ...role, monthlySalary: v })
                      }
                    />
                  ) : (
                    <Num
                      label="Day rate (8h)"
                      value={role.dayRateFor8h}
                      onChange={(v) =>
                        upsertRole({ ...role, dayRateFor8h: v })
                      }
                    />
                  )}
                  <Num
                    label="Machines / head"
                    value={role.machinesPerHead}
                    onChange={(v) =>
                      upsertRole({ ...role, machinesPerHead: v })
                    }
                  />
                  <div className="flex items-end">
                    <button
                      type="button"
                      className="min-h-11 text-body-sm text-error"
                      onClick={() =>
                        setRoles((prev) =>
                          prev.filter((r) => r.id !== role.id),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <p className="text-body-sm text-on-surface-variant">
                These sit on this machine only. Air, coolant, and tooling can
                be finished in Impact after it is on the list.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Num
                  label="Working days / year"
                  value={workingDaysPerYear}
                  required
                  onChange={setWorkingDaysPerYear}
                />
                <Num
                  label="Shifts / day"
                  value={shiftsPerDay}
                  required
                  onChange={setShiftsPerDay}
                />
                <Num
                  label="Hours / shift"
                  value={hoursPerShift}
                  required
                  onChange={setHoursPerShift}
                />
                <Num
                  label="Utilization %"
                  value={utilizationPct}
                  required
                  onChange={setUtilizationPct}
                />
                <Num
                  label="Machine cost (₹)"
                  value={machineCost}
                  onChange={setMachineCost}
                />
                <Num
                  label="Interest %"
                  value={interestRatePct}
                  step={0.25}
                  onChange={setInterestRatePct}
                />
                <Num
                  label="Loan tenure (years)"
                  value={tenureYears}
                  onChange={setTenureYears}
                />
                <Num
                  label="Connected load (kW)"
                  value={powerKw}
                  step={0.5}
                  required
                  onChange={setPowerKw}
                />
                <Num
                  label="Maintenance ₹ / year"
                  value={maintenanceAnnual}
                  onChange={setMaintenanceAnnual}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant px-4 py-3">
          <V2SecondaryButton type="button" onClick={onClose}>
            Cancel
          </V2SecondaryButton>
          <div className="flex flex-wrap gap-2">
            {step > 0 ? (
              <V2SecondaryButton type="button" onClick={() => setStep(step - 1)}>
                Back
              </V2SecondaryButton>
            ) : null}
            {step < STEPS.length - 1 ? (
              <V2PrimaryButton type="button" onClick={() => setStep(step + 1)}>
                Next
              </V2PrimaryButton>
            ) : (
              <V2PrimaryButton type="button" onClick={submit}>
                Add machine
              </V2PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
