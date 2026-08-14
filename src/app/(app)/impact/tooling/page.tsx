"use client";

import { Section } from "@/components/v2/editors/EditorPrimitives";
import { TypeToolingEditor } from "@/components/v2/editors/TypeToolingEditor";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";
import { useApplyMachineStructure } from "@/components/v2/useApplyMachineStructure";
import { V2Field, V2Select } from "@/components/v2/V2Ui";
import { defaultToolingLines, type V2ToolingLine } from "@/lib/v2/clientDb";

export default function ImpactToolingPage() {
  const {
    draft,
    moneyDirty,
    focusType,
    setFocusType,
    setFocusMachineId,
    upsertToolingLine,
    removeToolingLine,
  } = useImpactDraft();
  const { confirmStructure, dialog } = useApplyMachineStructure();

  const types = Array.from(new Set(draft.machines.map((m) => m.type)));
  const typeCount = draft.machines.filter((m) => m.type === focusType).length;
  const sampleName =
    draft.machines.find((m) => m.type === focusType)?.name ?? focusType;
  const lines = draft.toolingProfiles[focusType] ?? defaultToolingLines();

  function requestUpsert(line: V2ToolingLine) {
    const isNew = !lines.some((l) => l.id === line.id);
    if (!isNew) {
      upsertToolingLine(focusType, line);
      return;
    }
    confirmStructure({
      title: "Add tooling line",
      body: `Tooling profiles are shared by type. Add “${line.name || "New tooling line"}” for all ${focusType} machines?`,
      machineName: sampleName,
      machineType: focusType,
      typeCount: typeCount || 1,
      allowMachineOnly: false,
      apply: () => upsertToolingLine(focusType, line),
    });
  }

  function requestRemove(id: string) {
    const name = lines.find((l) => l.id === id)?.name ?? "line";
    confirmStructure({
      title: "Remove tooling line",
      body: `Remove “${name}” from the ${focusType} tooling profile (all ${typeCount || 1} machine(s))?`,
      machineName: sampleName,
      machineType: focusType,
      typeCount: typeCount || 1,
      allowMachineOnly: false,
      apply: () => removeToolingLine(focusType, id),
    });
  }

  return (
    <Section
      title="Tooling"
      body="Annual tooling lines by machine type."
    >
      {moneyDirty.tooling ? (
        <p className="mb-3 inline-flex items-center gap-2 text-body-sm text-amber-700">
          <span className="impact-dirty-light" />
          Changed vs baseline
        </p>
      ) : null}

      <div className="mb-4 max-w-sm">
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
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </V2Select>
        </V2Field>
      </div>

      {focusType ? (
        <TypeToolingEditor
          type={focusType}
          lines={lines}
          onUpsert={requestUpsert}
          onRemove={requestRemove}
        />
      ) : (
        <p className="text-body-sm text-on-surface-variant">
          Add machines in setup first.
        </p>
      )}
      {dialog}
    </Section>
  );
}
