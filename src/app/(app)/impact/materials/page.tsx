"use client";

import { MaterialGradesEditor } from "@/components/v2/editors/MaterialGradesEditor";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";

export default function MasterDataMaterialsPage() {
  const { draft, moneyDirty, upsertMaterialGrade, removeMaterialGrade } =
    useImpactDraft();
  const grades = draft.materialGrades ?? [];

  return (
    <div className="space-y-4 pt-4">
      <div>
        <h3 className="text-title-md text-on-surface">Material grades</h3>
        <p className="mt-1 max-w-2xl text-body-sm text-on-surface-variant">
          Raw and scrap ₹/kg for part cost. Changing rates lights yellow and
          updates the preview below — Cash MHR stays the same; part and quote
          cost move. Make live when ready.
        </p>
      </div>

      {moneyDirty.materials ? (
        <p className="text-body-sm text-primary">
          Material rates differ from live — see part cost in the preview strip.
        </p>
      ) : null}

      <div className="rounded-lg border border-outline-variant bg-surface-lowest p-4 sm:p-5">
        <MaterialGradesEditor
          grades={grades}
          onUpsert={upsertMaterialGrade}
          onRemove={removeMaterialGrade}
        />
      </div>
    </div>
  );
}
