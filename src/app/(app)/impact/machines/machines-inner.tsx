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
  syncMachineMaintenance,
  syncMachineUtilityAnnual,
} from "@/lib/v2/clientDb";
import { machineTabMoneyDirty } from "@/lib/v2/impactDirty";
import {
  machinesAfterUtilityAdd,
  machinesAfterUtilityRemove,
} from "@/lib/v2/utilityStructure";

export default function ImpactMachinesPageInner() {
  const searchParams = useSearchParams();
  const {
    draft,
    baselineSnap,
    moneyDirty,
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
    replaceDraftMachines,
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
  const sections = draft.sections ?? [];
  const machine = draft.machines.find((m) => m.id === focusMachineId);

  const browseSectionId = machine?.sectionId ?? sections[0]?.id ?? "";
  const machinesInSection = draft.machines.filter((m) =>
    browseSectionId ? m.sectionId === browseSectionId : !m.sectionId,
  );
  const typesInSection = Array.from(
    new Set(machinesInSection.map((m) => m.type)),
  );
  const effectiveType =
    focusType && typesInSection.includes(focusType)
      ? focusType
      : typesInSection[0] ?? types[0] ?? "";
  const machinesOfType = machinesInSection.filter(
    (m) => m.type === effectiveType,
  );
  const ohPerMachine = overheadAnnualPerMachine(
    draft.overheadLines,
    draft.machines.length || 1,
  );
  const typeCount = draft.machines.filter((m) => m.type === effectiveType)
    .length;
  const showMoneyChanged = moneyDirty.machines || moneyDirty.labour;

  return (
    <Section
      title="Machines"
      body="Calendar, EMI, labour, utility, and maintenance for the focus machine. Labour roles apply to every machine of this type."
    >
      {showMoneyChanged ? (
        <p className="mb-3 inline-flex items-center gap-2 text-body-sm text-amber-800">
          <span className="impact-dirty-light" />
          Cost inputs changed vs live — still exploring
        </p>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <V2PrimaryButton type="button" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 inline h-4 w-4" />
          Add machine
        </V2PrimaryButton>
        {machine ? (
          <button
            type="button"
            onClick={() => setRemoveOpen(true)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-outline-variant px-3 text-body-sm text-on-surface-variant hover:border-error/40 hover:text-error"
          >
            <Trash2 className="h-4 w-4" />
            Remove this machine
          </button>
        ) : null}
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <V2Field label="Section">
          <V2Select
            value={browseSectionId}
            onChange={(e) => {
              const nextSec = e.target.value || null;
              const inSec = draft.machines.filter((m) =>
                nextSec ? m.sectionId === nextSec : !m.sectionId,
              );
              const pick =
                inSec.find((m) => m.type === focusType) ?? inSec[0] ?? null;
              if (pick) {
                setFocusType(pick.type);
                setFocusMachineId(pick.id);
              } else if (machine && nextSec) {
                // Move focused machine into empty section
                upsertDraftMachine({ ...machine, sectionId: nextSec });
              }
            }}
            disabled={sections.length === 0}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            {draft.machines.some((m) => !m.sectionId) ? (
              <option value="">Unassigned</option>
            ) : null}
          </V2Select>
        </V2Field>
        <V2Field label="Type">
          <V2Select
            value={effectiveType}
            onChange={(e) => {
              const type = e.target.value;
              setFocusType(type);
              const first =
                machinesInSection.find((m) => m.type === type) ??
                draft.machines.find((m) => m.type === type);
              if (first) setFocusMachineId(first.id);
            }}
          >
            {(typesInSection.length ? typesInSection : types).length === 0 ? (
              <option value="">No types yet</option>
            ) : (
              (typesInSection.length ? typesInSection : types).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))
            )}
          </V2Select>
        </V2Field>
        <V2Field label="Machine">
          <V2Select
            value={focusMachineId}
            onChange={(e) => {
              const id = e.target.value;
              setFocusMachineId(id);
              const m = draft.machines.find((x) => x.id === id);
              if (m) setFocusType(m.type);
            }}
          >
            {(machinesOfType.length
              ? machinesOfType
              : draft.machines.filter((m) => m.type === effectiveType)
            ).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </V2Select>
        </V2Field>
        <V2Field label="Apply field changes to">
          <div className="flex min-h-11 flex-col justify-center gap-1.5">
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
              All {effectiveType || "type"} ({typeCount})
            </label>
          </div>
        </V2Field>
      </div>

      {machine ? (
        <>
          <div className="mb-3 flex flex-wrap gap-1">
            {IMPACT_MACHINE_SECTIONS.map((sec) => {
              const tabDirty = machineTabMoneyDirty(
                baselineSnap,
                draft,
                machine.id,
                sec,
              );
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
            typePeerCount={typeCount}
            onUpsertLabourRole={(role) =>
              upsertLabourRole(machine.type, role)
            }
            onRemoveLabourRole={(id) => removeLabourRole(machine.type, id)}
            onStatutory={setStatutory}
            onUtilityStructure={(action, scope) => {
              const next =
                action.kind === "add"
                  ? machinesAfterUtilityAdd(
                      draft.machines,
                      machine.id,
                      action.line,
                      scope,
                    )
                  : machinesAfterUtilityRemove(
                      draft.machines,
                      machine.id,
                      action.line,
                      scope,
                    );
              replaceDraftMachines(next);
            }}
            onChange={(next) => {
              const synced = syncMachineMaintenance(
                syncMachineUtilityAnnual(next),
              );
              if (applyScope === "machine") {
                upsertDraftMachine(synced);
                return;
              }
              const { id: _id, name, type: _type, ...shared } = synced;
              patchFocusedMachines(shared);
              upsertDraftMachine({ ...machine, ...shared, name });
            }}
          />
          <p className="mt-3 text-[11px] text-on-surface-variant">
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
