"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import {
  V2Field,
  V2Input,
  V2PrimaryButton,
  V2SecondaryButton,
  V2Select,
  IssuesBanner,
} from "@/components/v2/V2Ui";
import { Section, Num, RemoveIconButton } from "@/components/v2/editors/EditorPrimitives";
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
import { useApplyMachineStructure } from "@/components/v2/useApplyMachineStructure";
import {
  TableCellInput,
} from "@/components/plant/DataTable";
import {
  annualToPerHour,
  createDefaultSection,
  createEmptyMachine,
  defaultToolingLines,
  distinctMachineTypes,
  machineProductiveHours,
  overheadAnnualPerMachine,
  overheadAnnualPlant,
  syncMachineMaintenance,
  syncMachineUtilityAnnual,
  type OnboardingStep,
} from "@/lib/v2/clientDb";
import {
  machinesAfterUtilityAdd,
  machinesAfterUtilityRemove,
} from "@/lib/v2/utilityStructure";
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
  "utilities",
  "machines",
  "overhead",
  "review",
] as const;
type SetupStep = (typeof STEPS)[number];

const STEP_LABELS: Record<SetupStep, string> = {
  plant: "Plant",
  utilities: "Electricity",
  machines: "Sections & machines",
  overhead: "Overhead",
  review: "Review",
};

function resolveSetupStep(lastStep: OnboardingStep | string): SetupStep {
  // Legacy "sections" step is now part of machines
  if (lastStep === "sections") return "machines";
  if ((STEPS as readonly string[]).includes(lastStep)) {
    return lastStep as SetupStep;
  }
  return "plant";
}

function nextSectionName(
  hint: string | null | undefined,
  index1Based: number,
): string {
  if (hint === "customer") return `Customer ${index1Based}`;
  if (hint === "line") return `Line ${index1Based}`;
  if (hint === "shopfloor") return `Shopfloor ${index1Based}`;
  return `Section ${index1Based}`;
}

export default function SetupPage() {
  const router = useRouter();
  const {
    record,
    updatePlant,
    upsertMachine,
    setMachines,
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
    // applyPlantExample / applyMachineExample — re-wire when Load example returns
    setStep,
    completeOnboarding,
    setSections,
  } = useV2Graph();

  const { confirmStructure, dialog: structureDialog } =
    useApplyMachineStructure();

  const initialIndex = Math.max(
    0,
    STEPS.indexOf(resolveSetupStep(record.lastStep)),
  );
  const [index, setIndex] = useState(initialIndex);
  /** Furthest step unlocked by filling & continuing past prior steps. */
  const [furthestIndex, setFurthestIndex] = useState(initialIndex);
  const [bulkType, setBulkType] = useState("VMC");
  const [bulkCount, setBulkCount] = useState(1);
  const [customType, setCustomType] = useState("");
  /** undefined = not initialized; null = user collapsed; string = open section id */
  const [openSectionId, setOpenSectionId] = useState<
    string | null | undefined
  >(undefined);
  const [openMachine, setOpenMachine] = useState<string | null>(null);
  const [machineSection, setMachineSection] =
    useState<MachineSection>("calendar");

  const step = STEPS[index];
  const types = distinctMachineTypes(record);
  const sections = useMemo(
    () =>
      [...(record.sections ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [record.sections],
  );
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
    if (sections.length === 0) {
      setOpenSectionId(null);
      return;
    }
    setOpenSectionId((prev) => {
      if (prev === undefined) return sections[0]?.id ?? null;
      if (prev === null) return null;
      if (!sections.some((s) => s.id === prev)) return sections[0]?.id ?? null;
      return prev;
    });
  }, [sections]);

  function goNext() {
    if (index >= STEPS.length - 1 || !canAdvance) return;
    const next = index + 1;
    setFurthestIndex((f) => Math.max(f, next));
    setIndex(next);
  }
  function goBack() {
    if (index > 0) setIndex(index - 1);
  }
  /** Revisit only steps already unlocked (filled via Continue). */
  function canGoToStep(i: number) {
    return i >= 0 && i <= furthestIndex;
  }
  function goToStep(i: number) {
    if (canGoToStep(i)) setIndex(i);
  }

  function launch() {
    completeOnboarding();
    router.push("/factory");
  }

  function stepHasErrors(s: SetupStep) {
    if (s === "plant")
      return plantIssues(record).some((i) => i.severity === "error");
    if (s === "utilities")
      return utilityIssues(record).some((i) => i.severity === "error");
    if (s === "machines")
      return machinesStepIssues(record).some((i) => i.severity === "error");
    if (s === "overhead")
      return overheadIssues(record).some((i) => i.severity === "error");
    return false;
  }

  function stepLooksDone(s: SetupStep) {
    const i = STEPS.indexOf(s);
    if (i >= furthestIndex) return false;
    return !stepHasErrors(s);
  }

  return (
    <div className="flex min-h-[calc(100vh-2rem)] w-full flex-col sm:flex-row">
      {/* Mobile step strip */}
      <nav
        className="flex gap-1 overflow-x-auto border-b border-outline-variant px-2 py-2 sm:hidden"
        aria-label="Setup steps"
      >
        {STEPS.map((s, i) => {
          const current = i === index;
          const unlocked = canGoToStep(i);
          return (
            <button
              key={s}
              type="button"
              disabled={!unlocked}
              onClick={() => goToStep(i)}
              className={`shrink-0 rounded px-2.5 py-1.5 text-[11px] ${
                current
                  ? "bg-primary text-on-primary"
                  : unlocked
                    ? "bg-surface-low text-on-surface-variant"
                    : "cursor-not-allowed bg-surface-low/40 text-on-surface-variant/50"
              }`}
            >
              {i + 1}. {STEP_LABELS[s]}
            </button>
          );
        })}
      </nav>

      <aside className="sticky top-0 hidden h-[calc(100vh-1rem)] w-56 shrink-0 flex-col border-r border-outline-variant bg-surface-low/50 px-3 py-4 sm:flex">
        <p className="px-1.5 text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">
          Factory setup
        </p>
        <p className="mt-0.5 px-1.5 text-[11px] leading-snug text-on-surface-variant">
          Revisit steps you&apos;ve already filled.
        </p>
        <nav className="mt-3 flex flex-1 flex-col gap-0.5" aria-label="Setup steps">
          {STEPS.map((s, i) => {
            const current = i === index;
            const unlocked = canGoToStep(i);
            const done = stepLooksDone(s);
            const blocked = unlocked && stepHasErrors(s) && i !== index;
            return (
              <button
                key={s}
                type="button"
                disabled={!unlocked}
                onClick={() => goToStep(i)}
                aria-disabled={!unlocked}
                className={`flex items-start gap-2 rounded-md px-2 py-2 text-left transition-colors ${
                  current
                    ? "bg-primary/12 text-on-surface"
                    : unlocked
                      ? "text-on-surface-variant hover:bg-surface-lowest hover:text-on-surface"
                      : "cursor-not-allowed text-on-surface-variant/45"
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : blocked ? (
                    <AlertCircle className="h-4 w-4 text-error" />
                  ) : current ? (
                    <Circle className="h-4 w-4 fill-primary text-primary" />
                  ) : (
                    <Circle
                      className={`h-4 w-4 ${
                        unlocked ? "text-outline-variant" : "text-outline-variant/40"
                      }`}
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] tabular-nums text-on-surface-variant">
                    {i + 1}/{STEPS.length}
                  </span>
                  <span
                    className={`block text-body-sm leading-snug ${
                      current ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {STEP_LABELS[s]}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
        <p className="mt-auto px-1.5 pt-3 text-[10px] leading-snug text-on-surface-variant">
          Fill the current step, then Continue to unlock the next.
        </p>
      </aside>

      <div className="min-w-0 flex-1 px-3 py-4 sm:px-5 lg:px-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-headline-sm text-on-surface sm:text-headline-md">
              {STEP_LABELS[step]}
            </h1>
            <p className="mt-0.5 max-w-3xl text-[12px] leading-snug text-on-surface-variant sm:text-body-sm">
              Sections group machines · labour & tooling by type · overhead
              plant-wide · Cash MHR as ₹/hr.
            </p>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-on-surface-variant">
            Step {index + 1}/{STEPS.length}
          </span>
        </div>

        <div className="space-y-3">
          <IssuesBanner errors={stepErrors} warnings={stepWarnings} />

        {step === "plant" ? (
          <Section title="Plant identity" body="Who are you modelling? Required fields are marked *.">
            {/* Example seed paused — re-enable when demos need one-click plant
            <div className="mb-3">
              <V2SecondaryButton onClick={applyPlantExample}>
                Load example plant
              </V2SecondaryButton>
            </div>
            */}
            <PlantFields plant={record.plant} onChange={updatePlant} />
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
            title="Sections & machines"
            body="Sections are just named groups for machines. The chips only set how new sections are named — they are not different kinds of section."
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-on-surface-variant">
                  Name new sections like
                </span>
                {(
                  [
                    ["shopfloor", "Shopfloor"],
                    ["customer", "Customer"],
                    ["line", "Line / cell"],
                    ["other", "Custom"],
                  ] as const
                ).map(([hint, label]) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() =>
                      updatePlant({ sectionOrganizingHint: hint })
                    }
                    className={`rounded border px-2 py-1 text-[12px] ${
                      record.plant.sectionOrganizingHint === hint
                        ? "border-primary bg-primary/10 text-on-surface"
                        : "border-outline-variant text-on-surface-variant"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto rounded-lg border border-outline-variant">
                <table className="w-full min-w-[520px] table-fixed text-left">
                  <thead className="bg-surface-low text-body-sm text-on-surface-variant">
                    <tr>
                      <th className="px-2.5 py-2 font-medium">Section name</th>
                      <th className="w-24 px-2.5 py-2 font-medium">Machines</th>
                      <th className="w-24 px-2.5 py-2 font-medium" />
                      <th className="w-12 px-1 py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {sections.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-6 text-center text-body-sm text-on-surface-variant"
                        >
                          No sections yet — add one below.
                        </td>
                      </tr>
                    ) : (
                      sections.map((sec, i) => {
                        const sectionMachines = record.machines.filter(
                          (m) => m.sectionId === sec.id,
                        );
                        const typesInSection = Array.from(
                          new Set(sectionMachines.map((m) => m.type)),
                        );
                        const incompleteCount = sectionMachines.filter(
                          (m) => !machineIsComplete(m),
                        ).length;
                        const missingLabourTypes = typesInSection.filter(
                          (t) => (record.labourByType[t] ?? []).length === 0,
                        );
                        const needsAttention =
                          incompleteCount > 0 || missingLabourTypes.length > 0;
                        const expanded = openSectionId === sec.id;
                        return (
                          <Fragment key={sec.id}>
                            <tr
                              className={`border-t border-outline-variant/70 ${
                                expanded
                                  ? "bg-primary/5"
                                  : needsAttention
                                    ? "bg-error/5"
                                    : "hover:bg-surface-low/40"
                              }`}
                            >
                              <td className="px-2.5 py-2 align-middle">
                                <TableCellInput
                                  aria-label="Section name"
                                  value={sec.name}
                                  placeholder={nextSectionName(
                                    record.plant.sectionOrganizingHint,
                                    i + 1,
                                  )}
                                  onChange={(v) => {
                                    setSections(
                                      sections.map((s) =>
                                        s.id === sec.id
                                          ? { ...s, name: v }
                                          : s,
                                      ),
                                    );
                                  }}
                                />
                              </td>
                              <td className="px-2.5 py-2 align-middle">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-mono text-body-sm tabular-nums text-on-surface">
                                    {sectionMachines.length}
                                  </span>
                                  {incompleteCount > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] leading-tight text-error">
                                      <AlertCircle className="h-3 w-3 shrink-0" />
                                      {incompleteCount} incomplete
                                    </span>
                                  ) : null}
                                  {incompleteCount === 0 &&
                                  missingLabourTypes.length > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] leading-tight text-error">
                                      <AlertCircle className="h-3 w-3 shrink-0" />
                                      Add labour
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="px-2.5 py-2 align-middle">
                                <button
                                  type="button"
                                  className={`h-9 px-1 text-body-sm hover:underline ${
                                    needsAttention
                                      ? "font-medium text-error"
                                      : "text-primary"
                                  }`}
                                  aria-expanded={expanded}
                                  onClick={() => {
                                    if (expanded) {
                                      setOpenSectionId(null);
                                      return;
                                    }
                                    setOpenSectionId(sec.id);
                                    const firstIncomplete = sectionMachines.find(
                                      (m) => !machineIsComplete(m),
                                    );
                                    if (firstIncomplete) {
                                      setOpenMachine(firstIncomplete.id);
                                    }
                                  }}
                                >
                                  {expanded
                                    ? "Collapse"
                                    : needsAttention
                                      ? "Fix"
                                      : "Open"}
                                </button>
                              </td>
                              <td className="w-12 px-1 py-2 align-middle">
                                {sections.length > 1 ? (
                                  <RemoveIconButton
                                    label={`Remove ${sec.name || "section"}`}
                                    onClick={() => {
                                      setSections(
                                        sections.filter((s) => s.id !== sec.id),
                                      );
                                      if (openSectionId === sec.id) {
                                        setOpenSectionId(null);
                                      }
                                    }}
                                  />
                                ) : null}
                              </td>
                            </tr>
                            {expanded ? (
                              <tr className="border-t border-outline-variant/50 bg-surface-low/25">
                                <td colSpan={4} className="px-2.5 py-3">
                                  <div className="space-y-3">
                                    <div className="grid gap-2 rounded-md border border-outline-variant bg-surface-lowest p-2.5 sm:grid-cols-2 lg:grid-cols-4">
                                      <V2Field label="Type">
                                        <V2Select
                                          value={bulkType}
                                          onChange={(e) =>
                                            setBulkType(e.target.value)
                                          }
                                        >
                                          {[
                                            "VMC",
                                            "CNC Lathe",
                                            "HMC",
                                            "Other",
                                            ...types,
                                          ]
                                            .filter(
                                              (t, idx, a) =>
                                                a.indexOf(t) === idx,
                                            )
                                            .map((t) => (
                                              <option key={t} value={t}>
                                                {t}
                                              </option>
                                            ))}
                                        </V2Select>
                                      </V2Field>
                                      <Num
                                        label="Count"
                                        value={bulkCount}
                                        onChange={setBulkCount}
                                      />
                                      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
                                        <V2Input
                                          placeholder="Custom type"
                                          value={customType}
                                          onChange={(e) =>
                                            setCustomType(e.target.value)
                                          }
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
                                      <div className="flex items-end sm:col-span-2 lg:col-span-1">
                                        <V2PrimaryButton
                                          type="button"
                                          className="w-full"
                                          onClick={() => {
                                            addMachineType(bulkType);
                                            addBulkMachines(
                                              bulkType,
                                              Math.max(1, bulkCount),
                                              {
                                                powerKw:
                                                  bulkType === "VMC" ? 10 : 7.5,
                                                sectionId: sec.id,
                                              },
                                            );
                                          }}
                                        >
                                          <Plus className="h-4 w-4" />
                                          Add to{" "}
                                          {sec.name.trim() || "section"}
                                        </V2PrimaryButton>
                                      </div>
                                    </div>

                                    {typesInSection.map((type) => {
                                      const machinesOfType =
                                        sectionMachines.filter(
                                          (m) => m.type === type,
                                        );
                                      return (
                                        <div
                                          key={`${sec.id}-${type}`}
                                          className="space-y-2"
                                        >
                                          <TypeLabourEditor
                                            type={type}
                                            roles={
                                              record.labourByType[type] ?? []
                                            }
                                            statutory={record.statutory}
                                            machineCount={
                                              record.machines.filter(
                                                (m) => m.type === type,
                                              ).length
                                            }
                                            onUpsert={(role) => {
                                              const roles =
                                                record.labourByType[type] ?? [];
                                              const isNew = !roles.some(
                                                (r) => r.id === role.id,
                                              );
                                              if (!isNew) {
                                                upsertLabourRole(type, role);
                                                return;
                                              }
                                              const typeCount =
                                                record.machines.filter(
                                                  (m) => m.type === type,
                                                ).length;
                                              confirmStructure({
                                                title: "Add labour role",
                                                body: `Labour roles are shared by type. Add “${role.name || "New role"}” for all ${type} machines?`,
                                                machineName:
                                                  machinesOfType[0]?.name ??
                                                  type,
                                                machineType: type,
                                                typeCount: typeCount || 1,
                                                allowMachineOnly: false,
                                                apply: () =>
                                                  upsertLabourRole(type, role),
                                              });
                                            }}
                                            onRemove={(id) => {
                                              const name =
                                                (
                                                  record.labourByType[type] ??
                                                  []
                                                ).find((r) => r.id === id)
                                                  ?.name ?? "role";
                                              const typeCount =
                                                record.machines.filter(
                                                  (m) => m.type === type,
                                                ).length;
                                              confirmStructure({
                                                title: "Remove labour role",
                                                body: `Remove “${name}” from all ${type} machines?`,
                                                machineName:
                                                  machinesOfType[0]?.name ??
                                                  type,
                                                machineType: type,
                                                typeCount: typeCount || 1,
                                                allowMachineOnly: false,
                                                apply: () =>
                                                  removeLabourRole(type, id),
                                              });
                                            }}
                                            onStatutory={setStatutory}
                                          />
                                          <TypeToolingEditor
                                            type={type}
                                            lines={
                                              record.toolingProfiles[type] ??
                                              defaultToolingLines()
                                            }
                                            onUpsert={(line) => {
                                              const lines =
                                                record.toolingProfiles[type] ??
                                                defaultToolingLines();
                                              const isNew = !lines.some(
                                                (l) => l.id === line.id,
                                              );
                                              if (!isNew) {
                                                upsertTypeToolingLine(
                                                  type,
                                                  line,
                                                );
                                                return;
                                              }
                                              const typeCount =
                                                record.machines.filter(
                                                  (m) => m.type === type,
                                                ).length;
                                              confirmStructure({
                                                title: "Add tooling line",
                                                body: `Tooling is shared by type. Add “${line.name || "New tooling line"}” for all ${type} machines?`,
                                                machineName:
                                                  machinesOfType[0]?.name ??
                                                  type,
                                                machineType: type,
                                                typeCount: typeCount || 1,
                                                allowMachineOnly: false,
                                                apply: () =>
                                                  upsertTypeToolingLine(
                                                    type,
                                                    line,
                                                  ),
                                              });
                                            }}
                                            onRemove={(id) => {
                                              const lines =
                                                record.toolingProfiles[type] ??
                                                defaultToolingLines();
                                              const name =
                                                lines.find((l) => l.id === id)
                                                  ?.name ?? "line";
                                              const typeCount =
                                                record.machines.filter(
                                                  (m) => m.type === type,
                                                ).length;
                                              confirmStructure({
                                                title: "Remove tooling line",
                                                body: `Remove “${name}” from the ${type} tooling profile?`,
                                                machineName:
                                                  machinesOfType[0]?.name ??
                                                  type,
                                                machineType: type,
                                                typeCount: typeCount || 1,
                                                allowMachineOnly: false,
                                                apply: () =>
                                                  removeTypeToolingLine(
                                                    type,
                                                    id,
                                                  ),
                                              });
                                            }}
                                          />
                                          {machinesOfType.map((machine) => {
                                            const open =
                                              openMachine === machine.id;
                                            const hours =
                                              machineProductiveHours(machine);
                                            const breakup =
                                              liveBreakups[machine.id];
                                            const complete =
                                              machineIsComplete(machine);
                                            const issues =
                                              machineIssues(machine);
                                            return (
                                              <div
                                                key={machine.id}
                                                className={`rounded border bg-surface-low/30 ${
                                                  complete
                                                    ? "border-outline-variant/80"
                                                    : "border-error/40"
                                                }`}
                                              >
                                                <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5">
                                                  <button
                                                    type="button"
                                                    className="flex items-center gap-2 text-left text-body-sm font-medium text-on-surface"
                                                    onClick={() =>
                                                      setOpenMachine(
                                                        open
                                                          ? null
                                                          : machine.id,
                                                      )
                                                    }
                                                  >
                                                    {complete ? (
                                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                                    ) : (
                                                      <AlertCircle className="h-4 w-4 text-error" />
                                                    )}
                                                    {machine.name}
                                                    <span className="font-normal text-on-surface-variant">
                                                      · {machine.type}
                                                    </span>
                                                    {breakup ? (
                                                      <span className="ml-1 font-mono text-[12px] text-primary">
                                                        Cash{" "}
                                                        {formatInr(
                                                          breakup.manufacturingMhr,
                                                        )}
                                                        /hr
                                                      </span>
                                                    ) : null}
                                                  </button>
                                                  <div className="flex items-center gap-2">
                                                    {!complete ? (
                                                      <span className="text-code-sm text-error">
                                                        {
                                                          issues.filter(
                                                            (iss) =>
                                                              iss.severity ===
                                                              "error",
                                                          ).length
                                                        }{" "}
                                                        required empty
                                                      </span>
                                                    ) : null}
                                                    <RemoveIconButton
                                                      label={`Remove ${machine.name}`}
                                                      onClick={() =>
                                                        removeMachine(machine.id)
                                                      }
                                                    />
                                                  </div>
                                                </div>
                                                {open ? (
                                                  <div className="border-t border-outline-variant p-2.5">
                                                    {!complete ? (
                                                      <IssuesBanner
                                                        title="Complete this machine"
                                                        errors={issues
                                                          .filter(
                                                            (iss) =>
                                                              iss.severity ===
                                                              "error",
                                                          )
                                                          .map(
                                                            (iss) => iss.label,
                                                          )}
                                                        warnings={issues
                                                          .filter(
                                                            (iss) =>
                                                              iss.severity ===
                                                              "warn",
                                                          )
                                                          .map(
                                                            (iss) => iss.label,
                                                          )}
                                                      />
                                                    ) : null}
                                                    <div className="mb-2 flex flex-wrap gap-1">
                                                      {MACHINE_SECTIONS.map(
                                                        (ms) => (
                                                          <button
                                                            key={ms}
                                                            type="button"
                                                            onClick={() =>
                                                              setMachineSection(
                                                                ms,
                                                              )
                                                            }
                                                            className={`rounded px-2 py-0.5 text-[12px] capitalize ${
                                                              machineSection ===
                                                              ms
                                                                ? "bg-primary text-on-primary"
                                                                : "bg-surface-lowest text-on-surface-variant"
                                                            }`}
                                                          >
                                                            {ms}
                                                          </button>
                                                        ),
                                                      )}
                                                    </div>
                                                    <MachineSectionEditor
                                                      section={machineSection}
                                                      machine={machine}
                                                      hours={hours}
                                                      ctx={record}
                                                      ohPerMachine={
                                                        ohPerMachine
                                                      }
                                                      typePeerCount={
                                                        record.machines.filter(
                                                          (m) =>
                                                            m.type ===
                                                            machine.type,
                                                        ).length
                                                      }
                                                      onUtilityStructure={(
                                                        action,
                                                        scope,
                                                      ) => {
                                                        const next =
                                                          action.kind === "add"
                                                            ? machinesAfterUtilityAdd(
                                                                record.machines,
                                                                machine.id,
                                                                action.line,
                                                                scope,
                                                              )
                                                            : machinesAfterUtilityRemove(
                                                                record.machines,
                                                                machine.id,
                                                                action.line,
                                                                scope,
                                                              );
                                                        setMachines(next);
                                                      }}
                                                      onChange={(m) =>
                                                        upsertMachine(
                                                          syncMachineMaintenance(
                                                            syncMachineUtilityAnnual(
                                                              m,
                                                            ),
                                                          ),
                                                        )
                                                      }
                                                    />
                                                  </div>
                                                ) : null}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })}

                                    {sectionMachines.length === 0 ? (
                                      <p className="text-body-sm text-on-surface-variant">
                                        No machines yet — choose a type and
                                        count above.
                                      </p>
                                    ) : null}

                                    {typesInSection[0] ? (
                                      <V2SecondaryButton
                                        type="button"
                                        onClick={() => {
                                          const type = typesInSection[0];
                                          const next = createEmptyMachine(
                                            sectionMachines.filter(
                                              (m) => m.type === type,
                                            ).length + 1,
                                            type,
                                            sec.id,
                                          );
                                          upsertMachine(next);
                                          setOpenMachine(next.id);
                                        }}
                                      >
                                        <Plus className="h-4 w-4" />
                                        Add one more {typesInSection[0]}
                                      </V2SecondaryButton>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <V2SecondaryButton
                type="button"
                onClick={() => {
                  const sec = createDefaultSection(
                    nextSectionName(
                      record.plant.sectionOrganizingHint,
                      sections.length + 1,
                    ),
                  );
                  sec.sortOrder = sections.length;
                  setSections([...sections, sec]);
                  setOpenSectionId(sec.id);
                }}
              >
                <Plus className="mr-1 inline h-4 w-4" />
                Add section
              </V2SecondaryButton>

              {record.machines.some((m) => !m.sectionId) ? (
                <div className="rounded-lg border border-dashed border-outline-variant p-3">
                  <p className="text-body-sm font-medium text-on-surface">
                    Unassigned machines
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {record.machines
                      .filter((m) => !m.sectionId)
                      .map((m) => (
                        <li
                          key={m.id}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <span className="text-body-sm text-on-surface">
                            {m.name}
                          </span>
                          <select
                            className="h-8 rounded-sm border border-outline-variant bg-surface px-2 text-body-sm"
                            value=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              upsertMachine({
                                ...m,
                                sectionId: e.target.value,
                              });
                            }}
                          >
                            <option value="">Assign to section…</option>
                            {sections.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}

        {step === "overhead" ? (
          <Section
            title="Factory overhead (plant-wide)"
            body="FO ÷ machine count → ₹/hr on each machine. Independent of type."
          >
            <p className="mb-2 text-[12px] text-on-surface">
              Plant OH {formatInr(ohPlant)}/yr · ≈{" "}
              {formatInr(
                annualToPerHour(
                  ohPerMachine,
                  record.machines[0]
                    ? machineProductiveHours(record.machines[0])
                    : 2448,
                ),
              )}
              /hr per machine
            </p>
            <OverheadEditor
              lines={record.overheadLines}
              onUpsert={upsertOverheadLine}
              onRemove={removeOverheadLine}
            />
          </Section>
        ) : null}

        {step === "review" ? (
          <Section title="Review — Cash MHR by section">
            <div className="space-y-3">
              {sections.map((sec) => {
                const sectionMachines = record.machines.filter(
                  (m) => m.sectionId === sec.id,
                );
                if (sectionMachines.length === 0) return null;
                return (
                  <div
                    key={sec.id}
                    className="overflow-x-auto rounded-lg border border-outline-variant"
                  >
                    <div className="border-b border-outline-variant bg-surface-low px-2.5 py-1.5">
                      <p className="text-body-sm font-semibold text-on-surface">
                        {sec.name.trim() || "Untitled section"}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        {sectionMachines.length} machine
                        {sectionMachines.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <table className="min-w-full text-left text-[12px]">
                      <thead className="text-on-surface-variant">
                        <tr>
                          <th className="px-2.5 py-2 font-medium">Machine</th>
                          <th className="px-2.5 py-2 font-medium">Type</th>
                          <th className="px-2.5 py-2 font-medium">EMI</th>
                          <th className="px-2.5 py-2 font-medium">Labour</th>
                          <th className="px-2.5 py-2 font-medium">Utility</th>
                          <th className="px-2.5 py-2 font-medium">Maint</th>
                          <th className="px-2.5 py-2 font-medium">FO</th>
                          <th className="px-2.5 py-2 font-medium">Tooling</th>
                          <th className="px-2.5 py-2 font-medium">Cash MHR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectionMachines.map((m) => {
                          const b = liveBreakups[m.id];
                          return (
                            <tr
                              key={m.id}
                              className="border-t border-outline-variant/70"
                            >
                              <td className="px-2.5 py-1.5 text-on-surface">
                                {m.name}
                              </td>
                              <td className="px-2.5 py-1.5 text-on-surface-variant">
                                {m.type}
                              </td>
                              <td className="px-2.5 py-1.5 font-mono tabular-nums">
                                {formatInr(b?.emiPerHour ?? 0)}
                              </td>
                              <td className="px-2.5 py-1.5 font-mono tabular-nums">
                                {formatInr(b?.labourPerHour ?? 0)}
                              </td>
                              <td className="px-2.5 py-1.5 font-mono tabular-nums">
                                {formatInr(b?.utilityPerHour ?? 0)}
                              </td>
                              <td className="px-2.5 py-1.5 font-mono tabular-nums">
                                {formatInr(b?.maintenancePerHour ?? 0)}
                              </td>
                              <td className="px-2.5 py-1.5 font-mono tabular-nums">
                                {formatInr(b?.ohPerHour ?? 0)}
                              </td>
                              <td className="px-2.5 py-1.5 font-mono tabular-nums">
                                {formatInr(b?.toolingPerHour ?? 0)}
                              </td>
                              <td className="px-2.5 py-1.5 font-mono font-medium tabular-nums text-primary">
                                {formatInr(b?.manufacturingMhr ?? 0)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
              {record.machines.some((m) => !m.sectionId) ? (
                <div className="overflow-x-auto rounded-lg border border-dashed border-outline-variant">
                  <div className="border-b border-outline-variant bg-surface-low px-2.5 py-1.5">
                    <p className="text-body-sm font-semibold text-on-surface">
                      Unassigned
                    </p>
                  </div>
                  <table className="min-w-full text-left text-[12px]">
                    <tbody>
                      {record.machines
                        .filter((m) => !m.sectionId)
                        .map((m) => {
                          const b = liveBreakups[m.id];
                          return (
                            <tr
                              key={m.id}
                              className="border-t border-outline-variant/70"
                            >
                              <td className="px-2.5 py-1.5">{m.name}</td>
                              <td className="px-2.5 py-1.5 text-on-surface-variant">
                                {m.type}
                              </td>
                              <td className="px-2.5 py-1.5 font-mono font-medium tabular-nums text-primary">
                                {formatInr(b?.manufacturingMhr ?? 0)}/hr
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] text-on-surface-variant">
              All values ₹/hr. Depreciation excluded from Cash MHR. FO = plant
              total ÷ machine count.
            </p>
          </Section>
        ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant pt-3">
          <V2SecondaryButton type="button" onClick={goBack} disabled={index === 0}>
            Back
          </V2SecondaryButton>
          <div className="flex min-w-0 flex-1 flex-col items-end gap-1 sm:max-w-md">
            {!canAdvance && stepErrors.length > 0 ? (
              <p className="w-full text-right text-[11px] leading-snug text-error">
                Can&apos;t continue — {stepErrors.slice(0, 2).join("; ")}
                {stepErrors.length > 2
                  ? ` (+${stepErrors.length - 2} more)`
                  : ""}
                . Open the row marked Fix and fill required fields.
              </p>
            ) : null}
            {step === "review" ? (
              <V2PrimaryButton
                type="button"
                onClick={launch}
                disabled={!canAdvance}
              >
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
      </div>
      {structureDialog}
    </div>
  );
}
