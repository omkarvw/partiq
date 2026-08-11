"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import {
  StepProgress,
  V2Field,
  V2Input,
  V2PrimaryButton,
  V2SecondaryButton,
  V2Select,
  IssuesBanner,
} from "@/components/v2/V2Ui";
import { Section, Num } from "@/components/v2/editors/EditorPrimitives";
import { PlantFields } from "@/components/v2/editors/PlantFields";
import { UtilitiesFields } from "@/components/v2/editors/UtilitiesFields";
import { TypeLabourEditor } from "@/components/v2/editors/TypeLabourEditor";
import { TypeToolingEditor } from "@/components/v2/editors/TypeToolingEditor";
import { OverheadEditor } from "@/components/v2/editors/OverheadEditor";
import {
  MACHINE_SECTIONS,
  MachineSectionEditor,
  type MachineSection,
} from "@/components/v2/editors/MachineSectionEditor";
import {
  annualToPerHour,
  createDefaultSection,
  createEmptyMachine,
  defaultToolingLines,
  distinctMachineTypes,
  machineProductiveHours,
  overheadAnnualPerMachine,
  overheadAnnualPlant,
  type OnboardingStep,
} from "@/lib/v2/clientDb";
import {
  machineIsComplete,
  machineIssues,
  machinesStepIssues,
  overheadIssues,
  plantIssues,
  utilityIssues,
} from "@/lib/v2/setupValidation";
import { formatInr } from "@/lib/costing";
import { computeAllMachines } from "@/lib/factory/calcEngine";
import {
  toFactoryInputs as draftToFactory,
  toMachineInputs as draftToMachines,
} from "@/lib/v2/clientDb";

const STEPS = [
  "plant",
  "sections",
  "utilities",
  "machines",
  "overhead",
  "review",
] as const;
type SetupStep = (typeof STEPS)[number];

const STEP_LABELS: Record<SetupStep, string> = {
  plant: "Plant",
  sections: "Sections",
  utilities: "Electricity",
  machines: "Machines",
  overhead: "Overhead",
  review: "Review",
};

export default function SetupPage() {
  const router = useRouter();
  const {
    record,
    updatePlant,
    upsertMachine,
    removeMachine,
    addBulkMachines,
    addMachineType,
    upsertLabourRole,
    removeLabourRole,
    setStatutory,
    upsertOverheadLine,
    removeOverheadLine,
    upsertTypeToolingLine,
    removeTypeToolingLine,
    applyPlantExample,
    applyMachineExample,
    setStep,
    completeOnboarding,
    setSections,
  } = useV2Graph();

  const initialIndex = Math.max(
    0,
    STEPS.indexOf(
      (STEPS as readonly OnboardingStep[]).includes(record.lastStep)
        ? (record.lastStep as SetupStep)
        : "plant",
    ),
  );
  const [index, setIndex] = useState(initialIndex);
  const [bulkType, setBulkType] = useState("VMC");
  const [bulkCount, setBulkCount] = useState(1);
  const [customType, setCustomType] = useState("");
  /** undefined = not initialized; null = user collapsed; string = open type */
  const [openType, setOpenType] = useState<string | null | undefined>(
    undefined,
  );
  const [openMachine, setOpenMachine] = useState<string | null>(null);
  const [machineSection, setMachineSection] =
    useState<MachineSection>("calendar");

  const step = STEPS[index];
  const types = distinctMachineTypes(record);
  const ohPlant = overheadAnnualPlant(record.overheadLines);
  const ohPerMachine = overheadAnnualPerMachine(
    record.overheadLines,
    record.machines.length || 1,
  );

  const liveBreakups = useMemo(() => {
    if (record.machines.length === 0) return {};
    try {
      const factory = draftToFactory(record.plant, record);
      const machines = draftToMachines(record);
      return computeAllMachines(factory, machines);
    } catch {
      return {};
    }
  }, [record]);

  const canAdvance = useMemo(() => {
    if (step === "plant") return plantIssues(record).every((i) => i.severity !== "error");
    if (step === "sections")
      return (record.sections ?? []).some((s) => s.name.trim().length > 0);
    if (step === "utilities")
      return utilityIssues(record).every((i) => i.severity !== "error");
    if (step === "machines")
      return machinesStepIssues(record).every((i) => i.severity !== "error");
    if (step === "overhead")
      return overheadIssues(record).every((i) => i.severity !== "error");
    return true;
  }, [step, record]);

  const stepIssues = useMemo(() => {
    if (step === "plant") return plantIssues(record);
    if (step === "sections") {
      if (!(record.sections ?? []).some((s) => s.name.trim())) {
        return [
          {
            severity: "error" as const,
            label: "Name at least one section",
          },
        ];
      }
      return [];
    }
    if (step === "utilities") return utilityIssues(record);
    if (step === "machines") return machinesStepIssues(record);
    if (step === "overhead") return overheadIssues(record);
    return [];
  }, [step, record]);

  const stepErrors = stepIssues
    .filter((i) => i.severity === "error")
    .map((i) => i.label);
  const stepWarnings = stepIssues
    .filter((i) => i.severity === "warn")
    .map((i) => i.label);

  useEffect(() => {
    if (record.lastStep !== step) setStep(step);
  }, [step, setStep, record.lastStep]);

  useEffect(() => {
    if (types.length === 0) {
      setOpenType(null);
      return;
    }
    setOpenType((prev) => {
      // First visit: open the first type
      if (prev === undefined) return types[0];
      // User collapsed — respect it
      if (prev === null) return null;
      // Type removed / renamed — fall back
      if (!types.includes(prev)) return types[0];
      return prev;
    });
  }, [types]);

  function goNext() {
    if (index < STEPS.length - 1) setIndex(index + 1);
  }
  function goBack() {
    if (index > 0) setIndex(index - 1);
  }

  function launch() {
    completeOnboarding();
    router.push("/factory");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-headline-lg text-on-surface">Factory setup</h1>
      <p className="mt-1 text-body-md text-on-surface-variant">
        Machine types first, fill each machine (calendar + cost heads), then
        plant factory overhead. Figures show as ₹/hr.
      </p>

      <div className="mt-6">
        <StepProgress
          step={index + 1}
          total={STEPS.length}
          label={STEP_LABELS[step]}
        />
      </div>

      <div className="mt-6 space-y-4">
        <IssuesBanner errors={stepErrors} warnings={stepWarnings} />

        {step === "plant" ? (
          <Section title="Plant identity" body="Who are you modelling? Required fields are marked *.">
            <div className="mb-3">
              <V2SecondaryButton onClick={applyPlantExample}>
                Load example plant
              </V2SecondaryButton>
            </div>
            <PlantFields plant={record.plant} onChange={updatePlant} />
          </Section>
        ) : null}

        {step === "sections" ? (
          <Section
            title="How do you group machines?"
            body="Name buckets however you think — shopfloor bays, customers, lines. You can change this later. One section is enough."
          >
            <div className="mb-4 flex flex-wrap gap-2">
              {(
                [
                  ["shopfloor", "Shopfloor areas"],
                  ["customer", "By customer"],
                  ["line", "By line / cell"],
                  ["other", "I’ll name my own"],
                ] as const
              ).map(([hint, label]) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() =>
                    updatePlant({ sectionOrganizingHint: hint })
                  }
                  className={`rounded-lg border px-3 py-2 text-body-sm ${
                    record.plant.sectionOrganizingHint === hint
                      ? "border-primary bg-primary/10 text-on-surface"
                      : "border-outline-variant text-on-surface-variant"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {(record.sections ?? []).map((sec, i) => (
                <div key={sec.id} className="flex gap-2">
                  <V2Input
                    value={sec.name}
                    onChange={(e) => {
                      const next = (record.sections ?? []).map((s) =>
                        s.id === sec.id ? { ...s, name: e.target.value } : s,
                      );
                      setSections(next);
                    }}
                    placeholder={
                      record.plant.sectionOrganizingHint === "customer"
                        ? `Customer ${i + 1}`
                        : `Section ${i + 1}`
                    }
                  />
                </div>
              ))}
            </div>
            <div className="mt-3">
              <V2SecondaryButton
                type="button"
                onClick={() => {
                  const sec = createDefaultSection(
                    `Section ${(record.sections?.length ?? 0) + 1}`,
                  );
                  sec.sortOrder = record.sections?.length ?? 0;
                  setSections([...(record.sections ?? []), sec]);
                }}
              >
                <Plus className="mr-1 inline h-4 w-4" />
                Add section
              </V2SecondaryButton>
            </div>
          </Section>
        ) : null}

        {step === "utilities" ? (
          <Section
            title="Plant electricity tariff"
            body="Shared ₹/kWh for the plant. Machine kW and fluids are entered per machine later."
          >
            <UtilitiesFields
              electricityRatePerKwh={record.plant.electricityRatePerKwh}
              onChange={(rate) =>
                updatePlant({ electricityRatePerKwh: rate })
              }
            />
          </Section>
        ) : null}

        {step === "machines" ? (
          <Section
            title="Machine types → machines"
            body="Outer layer is machine type. Inside each type: labour roles, tooling defaults, then each machine with calendar / EMI / labour / utility / maintenance / tooling."
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <V2SecondaryButton onClick={applyMachineExample}>
                Load example (Brother VMC + Lathe)
              </V2SecondaryButton>
            </div>

            <div className="mb-4 grid gap-3 rounded border border-outline-variant p-3 sm:grid-cols-4">
              <V2Field label="Type">
                <V2Select
                  value={bulkType}
                  onChange={(e) => setBulkType(e.target.value)}
                >
                  {["VMC", "CNC Lathe", "HMC", "Other", ...types]
                    .filter((t, i, a) => a.indexOf(t) === i)
                    .map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                </V2Select>
              </V2Field>
              <Num label="Count" value={bulkCount} onChange={setBulkCount} />
              <div className="flex items-end">
                <V2PrimaryButton
                  type="button"
                  className="w-full"
                  onClick={() => {
                    addMachineType(bulkType);
                    addBulkMachines(bulkType, Math.max(1, bulkCount), {
                      powerKw: bulkType === "VMC" ? 10 : 7.5,
                      sectionId: record.sections?.[0]?.id ?? null,
                    });
                    setOpenType(bulkType);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add machines
                </V2PrimaryButton>
              </div>
              <div className="flex items-end gap-2">
                <V2Input
                  placeholder="Custom type"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                />
                <V2SecondaryButton
                  type="button"
                  onClick={() => {
                    if (!customType.trim()) return;
                    addMachineType(customType.trim());
                    setBulkType(customType.trim());
                    setCustomType("");
                  }}
                >
                  Add type
                </V2SecondaryButton>
              </div>
            </div>

            {types.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">
                Add a machine type to begin.
              </p>
            ) : (
              <div className="space-y-3">
                {types.map((type) => {
                  const machines = record.machines.filter((m) => m.type === type);
                  const expanded = openType === type;
                  return (
                    <div
                      key={type}
                      className="rounded border border-outline-variant"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                        onClick={() =>
                          setOpenType(expanded ? null : type)
                        }
                      >
                        <span className="font-medium text-on-surface">
                          {type}{" "}
                          <span className="text-on-surface-variant">
                            ({machines.length} machines)
                          </span>
                        </span>
                        <span className="text-body-sm text-primary">
                          {expanded ? "Collapse" : "Open"}
                        </span>
                      </button>

                      {expanded ? (
                        <div className="space-y-4 border-t border-outline-variant p-4">
                          <TypeLabourEditor
                            type={type}
                            roles={record.labourByType[type] ?? []}
                            statutory={record.statutory}
                            machineCount={machines.length}
                            onUpsert={(role) => upsertLabourRole(type, role)}
                            onRemove={(id) => removeLabourRole(type, id)}
                            onStatutory={setStatutory}
                          />
                          <TypeToolingEditor
                            type={type}
                            lines={
                              record.toolingProfiles[type] ??
                              defaultToolingLines()
                            }
                            onUpsert={(line) =>
                              upsertTypeToolingLine(type, line)
                            }
                            onRemove={(id) =>
                              removeTypeToolingLine(type, id)
                            }
                          />

                          {machines.map((machine) => {
                            const open = openMachine === machine.id;
                            const hours = machineProductiveHours(machine);
                            const breakup = liveBreakups[machine.id];
                            const complete = machineIsComplete(machine);
                            const issues = machineIssues(machine);
                            return (
                              <div
                                key={machine.id}
                                className={`rounded border bg-surface-low/30 ${
                                  complete
                                    ? "border-outline-variant/80"
                                    : "border-error/40"
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                                  <button
                                    type="button"
                                    className="flex items-center gap-2 text-left font-medium text-on-surface"
                                    onClick={() =>
                                      setOpenMachine(open ? null : machine.id)
                                    }
                                  >
                                    {complete ? (
                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-error" />
                                    )}
                                    {machine.name}
                                    {breakup ? (
                                      <span className="ml-2 font-mono text-body-sm text-primary">
                                        Cash {formatInr(breakup.manufacturingMhr)}
                                        /hr
                                      </span>
                                    ) : null}
                                  </button>
                                  <div className="flex items-center gap-2">
                                    {!complete ? (
                                      <span className="text-code-sm text-error">
                                        {
                                          issues.filter((i) => i.severity === "error")
                                            .length
                                        }{" "}
                                        required empty
                                      </span>
                                    ) : null}
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-1 text-body-sm text-error"
                                      onClick={() => removeMachine(machine.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Remove
                                    </button>
                                  </div>
                                </div>
                                {open ? (
                                  <div className="border-t border-outline-variant p-3">
                                    {!complete ? (
                                      <IssuesBanner
                                        title="Complete this machine"
                                        errors={issues
                                          .filter((i) => i.severity === "error")
                                          .map((i) => i.label)}
                                        warnings={issues
                                          .filter((i) => i.severity === "warn")
                                          .map((i) => i.label)}
                                      />
                                    ) : null}
                                    <div className="mb-3 flex flex-wrap gap-1">
                                      {MACHINE_SECTIONS.map((sec) => (
                                        <button
                                          key={sec}
                                          type="button"
                                          onClick={() =>
                                            setMachineSection(sec)
                                          }
                                          className={`rounded px-2 py-1 text-body-sm capitalize ${
                                            machineSection === sec
                                              ? "bg-primary text-on-primary"
                                              : "bg-surface-lowest text-on-surface-variant"
                                          }`}
                                        >
                                          {sec}
                                        </button>
                                      ))}
                                    </div>
                                    <MachineSectionEditor
                                      section={machineSection}
                                      machine={machine}
                                      hours={hours}
                                      ctx={record}
                                      ohPerMachine={ohPerMachine}
                                      onChange={upsertMachine}
                                    />
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}

                          <V2SecondaryButton
                            type="button"
                            onClick={() => {
                              const next = createEmptyMachine(
                                machines.length + 1,
                                type,
                              );
                              upsertMachine(next);
                              setOpenMachine(next.id);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                            Add one {type}
                          </V2SecondaryButton>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        ) : null}

        {step === "overhead" ? (
          <Section
            title="Factory overhead (plant-wide)"
            body="Independent of machine type. Allocated as FO ÷ total machines → ₹/hr on each machine."
          >
            <p className="mb-3 text-body-sm text-on-surface">
              Plant OH {formatInr(ohPlant)}/yr · ≈{" "}
              {formatInr(
                annualToPerHour(
                  ohPerMachine,
                  record.machines[0]
                    ? machineProductiveHours(record.machines[0])
                    : 2448,
                ),
              )}
              /hr per machine (using first machine&apos;s productive hours)
            </p>
            <OverheadEditor
              lines={record.overheadLines}
              onUpsert={upsertOverheadLine}
              onRemove={removeOverheadLine}
            />
          </Section>
        ) : null}

        {step === "review" ? (
          <Section title="Review — Cash MHR by machine">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-body-sm">
                <thead>
                  <tr className="text-on-surface-variant">
                    <th className="py-2 pr-3">Machine</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">EMI</th>
                    <th className="py-2 pr-3">Labour</th>
                    <th className="py-2 pr-3">Utility</th>
                    <th className="py-2 pr-3">Maint</th>
                    <th className="py-2 pr-3">FO</th>
                    <th className="py-2 pr-3">Tooling</th>
                    <th className="py-2 pr-3">Cash MHR</th>
                  </tr>
                </thead>
                <tbody>
                  {record.machines.map((m) => {
                    const b = liveBreakups[m.id];
                    return (
                      <tr key={m.id} className="border-t border-outline-variant">
                        <td className="py-2 pr-3">{m.name}</td>
                        <td className="py-2 pr-3">{m.type}</td>
                        <td className="py-2 pr-3 font-mono">
                          {formatInr(b?.emiPerHour ?? 0)}
                        </td>
                        <td className="py-2 pr-3 font-mono">
                          {formatInr(b?.labourPerHour ?? 0)}
                        </td>
                        <td className="py-2 pr-3 font-mono">
                          {formatInr(b?.utilityPerHour ?? 0)}
                        </td>
                        <td className="py-2 pr-3 font-mono">
                          {formatInr(b?.maintenancePerHour ?? 0)}
                        </td>
                        <td className="py-2 pr-3 font-mono">
                          {formatInr(b?.ohPerHour ?? 0)}
                        </td>
                        <td className="py-2 pr-3 font-mono">
                          {formatInr(b?.toolingPerHour ?? 0)}
                        </td>
                        <td className="py-2 pr-3 font-mono font-medium">
                          {formatInr(b?.manufacturingMhr ?? 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-body-sm text-on-surface-variant">
              All values ₹/hr. Depreciation excluded from Cash MHR (Excel
              parity). FO = plant total ÷ machine count.
            </p>
          </Section>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <V2SecondaryButton type="button" onClick={goBack} disabled={index === 0}>
          Back
        </V2SecondaryButton>
        {step === "review" ? (
          <V2PrimaryButton type="button" onClick={launch} disabled={!canAdvance}>
            Launch dashboard
          </V2PrimaryButton>
        ) : (
          <V2PrimaryButton
            type="button"
            onClick={goNext}
            disabled={!canAdvance}
          >
            Continue
          </V2PrimaryButton>
        )}
      </div>
    </div>
  );
}
