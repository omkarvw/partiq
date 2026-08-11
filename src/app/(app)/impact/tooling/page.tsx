"use client";

import { Section } from "@/components/v2/editors/EditorPrimitives";
import { TypeToolingEditor } from "@/components/v2/editors/TypeToolingEditor";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";
import { V2Field, V2Select } from "@/components/v2/V2Ui";
import { defaultToolingLines } from "@/lib/v2/clientDb";

export default function ImpactToolingPage() {
  const {
    draft,
    dirty,
    focusType,
    setFocusType,
    setFocusMachineId,
    upsertToolingLine,
    removeToolingLine,
  } = useImpactDraft();

  const types = Array.from(new Set(draft.machines.map((m) => m.type)));

  return (
    <Section
      title="Tooling"
      body="Annual tooling lines by machine type."
    >
      {dirty.tooling ? (
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
          lines={draft.toolingProfiles[focusType] ?? defaultToolingLines()}
          onUpsert={(line) => upsertToolingLine(focusType, line)}
          onRemove={(id) => removeToolingLine(focusType, id)}
        />
      ) : (
        <p className="text-body-sm text-on-surface-variant">
          Add machines in setup first.
        </p>
      )}
    </Section>
  );
}
