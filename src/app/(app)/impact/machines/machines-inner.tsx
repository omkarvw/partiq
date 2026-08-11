"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Section } from "@/components/v2/editors/EditorPrimitives";
import {
  IMPACT_MACHINE_SECTIONS,
  MachineSectionEditor,
  type MachineSection,
} from "@/components/v2/editors/MachineSectionEditor";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";
import { V2Field, V2PrimaryButton, V2Select } from "@/components/v2/V2Ui";
import { AddMachineModal } from "@/components/plant/AddMachineModal";
import { ConfirmDialog } from "@/components/plant/ConfirmDialog";
import {
  machineProductiveHours,
  overheadAnnualPerMachine,
  syncMachineUtilityAnnual,
} from "@/lib/v2/clientDb";

export default function ImpactMachinesPageInner() {
  const searchParams = useSearchParams();
  const {
    draft,
    dirty,
    focusType,
    setFocusType,
    focusMachineId,
    setFocusMachineId,
    applyScope,
    setApplyScope,
    upsertDraftMachine,
    addDraftMachine,
    removeDraftMachine,
    setLabourForType,
    patchFocusedMachines,
    upsertLabourRole,
    removeLabourRole,
    setStatutory,
  } = useImpactDraft();

  const [section, setSection] = useState<MachineSection>("calendar");
  const [addOpen, setAddOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "labour") setSection("labour");
  }, [searchParams]);

  const types = Array.from(new Set(draft.machines.map((m) => m.type)));
  const machinesOfType = draft.machines.filter((m) => m.type === focusType);
  const machine = draft.machines.find((m) => m.id === focusMachineId);
  const ohPerMachine = overheadAnnualPerMachine(
    draft.overheadLines,
    draft.machines.length || 1,
  );
  const typeCount = machinesOfType.length;
  const sections = draft.sections ?? [];

  return (
    <Section
      title="Machines"
      body="Calendar, EMI, labour, utility, and maintenance for the focus machine. Labour roles apply to every machine of this type."
    >
      {dirty.machines || dirty.labour ? (
        <p className="mb-3 inline-flex items-center gap-2 text-body-sm text-amber-700">
          <span className="impact-dirty-light" />
          Changed vs live — still exploring
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <V2PrimaryButton type="button" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 inline h-4 w-4" />
          Add machine
        </V2PrimaryButton>
        {machine ? (
          <button
            type="button"
            onClick={() => setRemoveOpen(true)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-outline-variant px-3 text-body-sm text-on-surface-variant hover:border-error/40 hover:text-error"
          >
            <Trash2 className="h-4 w-4" />
            Remove this machine
          </button>
        ) : null}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <V2Field label="Machine type">
          <V2Select
            value={focusType}
            onChange={(e) => {
              const type = e.target.value;
              setFocusType(type);
              const first = draft.machines.find((m) => m.type === type);
              if (first) setFocusMachineId(first.id);
            }}
          >
            {types.length === 0 ? (
              <option value="">No types yet</option>
            ) : (
              types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))
            )}
          </V2Select>
        </V2Field>
        <V2Field label="Focus machine">
          <V2Select
            value={focusMachineId}
            onChange={(e) => setFocusMachineId(e.target.value)}
          >
            {machinesOfType.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </V2Select>
        </V2Field>
        <V2Field label="Apply field changes to">
          <div className="flex min-h-11 flex-col justify-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-body-sm">
              <input
                type="radio"
                checked={applyScope === "machine"}
                onChange={() => setApplyScope("machine")}
              />
              This machine only
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-body-sm">
              <input
                type="radio"
                checked={applyScope === "type"}
                onChange={() => setApplyScope("type")}
              />
              All {focusType || "type"} ({typeCount})
            </label>
          </div>
        </V2Field>
      </div>

      {machine ? (
        <>
          {sections.length > 0 ? (
            <div className="mb-3 max-w-xs">
              <V2Field label="Section">
                <V2Select
                  value={machine.sectionId ?? ""}
                  onChange={(e) =>
                    upsertDraftMachine({
                      ...machine,
                      sectionId: e.target.value || null,
                    })
                  }
                >
                  <option value="">Unassigned</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </V2Select>
              </V2Field>
            </div>
          ) : null}
          <div className="mb-3 flex flex-wrap gap-1">
            {IMPACT_MACHINE_SECTIONS.map((sec) => {
              const tabDirty =
                sec === "labour"
                  ? dirty.labour
                  : sec !== "calendar" && dirty.machines;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSection(sec)}
                  className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-body-sm capitalize ${
                    section === sec
                      ? "bg-primary text-on-primary"
                      : "bg-surface-lowest text-on-surface-variant"
                  }`}
                >
                  {tabDirty ? (
                    <span className="impact-dirty-light" aria-hidden />
                  ) : null}
                  {sec}
                </button>
              );
            })}
          </div>
          <MachineSectionEditor
            section={section}
            machine={machine}
            hours={machineProductiveHours(machine)}
            ctx={draft}
            ohPerMachine={ohPerMachine}
            onUpsertLabourRole={(role) =>
              upsertLabourRole(machine.type, role)
            }
            onRemoveLabourRole={(id) => removeLabourRole(machine.type, id)}
            onStatutory={setStatutory}
            onChange={(next) => {
              const synced = syncMachineUtilityAnnual(next);
              if (applyScope === "machine") {
                upsertDraftMachine(synced);
                return;
              }
              const { id: _id, name, type: _type, ...shared } = synced;
              patchFocusedMachines(shared);
              upsertDraftMachine({ ...machine, ...shared, name });
            }}
          />
          <p className="mt-3 text-body-sm text-on-surface-variant">
            {section === "labour"
              ? `Labour roles apply to all ${typeCount} ${focusType || "type"} machine(s).`
              : `Field edits apply to ${
                  applyScope === "type"
                    ? `all ${typeCount} ${focusType} machine(s)`
                    : machine.name
                }.`}
          </p>
        </>
      ) : (
        <p className="text-body-sm text-on-surface-variant">
          No machines in this what-if yet — add one above.
        </p>
      )}

      <AddMachineModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add machine to what-if"
        types={Array.from(new Set([...(draft.machineTypes ?? []), ...types]))}
        sections={sections}
        labourByType={draft.labourByType}
        typeCounts={Object.fromEntries(
          (draft.machineTypes ?? types).map((t) => [
            t,
            draft.machines.filter((m) => m.type === t).length,
          ]),
        )}
        defaultSectionId={machine?.sectionId ?? sections[0]?.id ?? null}
        onAdd={({ name, type, sectionId, labourRoles, machine: extras }) => {
          setLabourForType(type, labourRoles);
          addDraftMachine(type, sectionId, name || undefined, extras);
        }}
      />
      <ConfirmDialog
        open={removeOpen}
        title="Remove from this what-if?"
        body={
          machine
            ? `${machine.name} leaves the what-if only. Discard restores the live factory if you have not made this live.`
            : ""
        }
        confirmLabel="Remove machine"
        tone="danger"
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          if (machine) removeDraftMachine(machine.id);
        }}
      />
    </Section>
  );
}
