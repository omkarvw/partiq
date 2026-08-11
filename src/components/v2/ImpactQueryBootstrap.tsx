"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";

/** Applies ?scenario= / ?type= / ?machine= once without remounting the draft provider. */
export function ImpactQueryBootstrap() {
  const searchParams = useSearchParams();
  const {
    loadScenario,
    setFocusType,
    setFocusMachineId,
    draft,
  } = useImpactDraft();

  useEffect(() => {
    const scenarioId = searchParams.get("scenario");
    if (scenarioId) loadScenario(scenarioId);

    const type = searchParams.get("type");
    if (type) {
      setFocusType(type);
      const first = draft.machines.find((m) => m.type === type);
      if (first) setFocusMachineId(first.id);
    }

    const machine = searchParams.get("machine");
    if (machine) {
      setFocusMachineId(machine);
      const hit = draft.machines.find((m) => m.id === machine);
      if (hit) setFocusType(hit.type);
    }
    // Only react to query string changes, not draft edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
