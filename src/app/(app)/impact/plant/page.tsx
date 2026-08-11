"use client";

import { Section } from "@/components/v2/editors/EditorPrimitives";
import { PlantFields } from "@/components/v2/editors/PlantFields";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";

export default function ImpactPlantPage() {
  const { draft, patchPlant, dirty } = useImpactDraft();

  return (
    <Section
      title="Plant"
      body="Identity fields for the plant you are modelling."
    >
      {dirty.plant ? (
        <p className="mb-3 inline-flex items-center gap-2 text-body-sm text-amber-700">
          <span className="impact-dirty-light" />
          Changed vs baseline
        </p>
      ) : null}
      <PlantFields plant={draft.plant} onChange={patchPlant} />
    </Section>
  );
}
