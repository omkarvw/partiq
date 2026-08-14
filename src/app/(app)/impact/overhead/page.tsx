"use client";

import { Section } from "@/components/v2/editors/EditorPrimitives";
import { OverheadEditor } from "@/components/v2/editors/OverheadEditor";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";
import {
  annualToPerHour,
  machineProductiveHours,
  overheadAnnualPerMachine,
  overheadAnnualPlant,
} from "@/lib/v2/clientDb";
import { formatInr } from "@/lib/costing";

export default function ImpactOverheadPage() {
  const { draft, moneyDirty, upsertOverheadLine, removeOverheadLine } =
    useImpactDraft();

  const ohPlant = overheadAnnualPlant(draft.overheadLines);
  const ohPerMachine = overheadAnnualPerMachine(
    draft.overheadLines,
    draft.machines.length || 1,
  );
  const hours = draft.machines[0]
    ? machineProductiveHours(draft.machines[0])
    : 2448;

  return (
    <Section
      title="Factory overhead"
      body="Plant-wide people salaries, rent, and fixed lines. Allocated as FO ÷ machine count."
    >
      {moneyDirty.overhead ? (
        <p className="mb-3 inline-flex items-center gap-2 text-body-sm text-amber-700">
          <span className="impact-dirty-light" />
          Changed vs baseline
        </p>
      ) : null}

      <p className="mb-3 text-body-sm text-on-surface">
        Plant OH {formatInr(ohPlant)}/yr · ≈{" "}
        {formatInr(annualToPerHour(ohPerMachine, hours))}/hr per machine
      </p>

      <OverheadEditor
        lines={draft.overheadLines}
        onUpsert={upsertOverheadLine}
        onRemove={removeOverheadLine}
      />
    </Section>
  );
}
