"use client";

import { useState } from "react";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";
import {
  V2Field,
  V2Input,
  V2PrimaryButton,
  V2SecondaryButton,
} from "@/components/v2/V2Ui";

export function ImpactCommitBar() {
  const { isDirty, discard, adoptAsBaseline, saveAsScenario } =
    useImpactDraft();
  const [scenarioName, setScenarioName] = useState("");
  const [baselineName, setBaselineName] = useState("");
  const [mode, setMode] = useState<"idle" | "scenario" | "baseline">("idle");

  if (!isDirty) {
    return (
      <div className="sticky bottom-0 z-20 border-t border-outline-variant bg-background/95 px-4 py-3 backdrop-blur">
        <p className="text-body-sm text-on-surface-variant">
          No changes yet. Edit a cost area or add machines — insights update
          without touching your live factory.
        </p>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 z-20 border-t border-amber-700/30 bg-amber-50/95 px-4 py-3 backdrop-blur">
      <p className="mb-2 text-body-sm font-medium text-amber-900">
        Exploring — live Factory Pulse is unchanged until you make this live.
      </p>
      {mode === "idle" ? (
        <div className="flex flex-wrap items-center gap-2">
          <V2SecondaryButton type="button" onClick={discard}>
            Discard
          </V2SecondaryButton>
          <V2SecondaryButton
            type="button"
            onClick={() => {
              setMode("scenario");
              setScenarioName("");
            }}
          >
            Save this what-if
          </V2SecondaryButton>
          <V2PrimaryButton
            type="button"
            onClick={() => {
              setMode("baseline");
              setBaselineName("");
            }}
          >
            Make this your live factory
          </V2PrimaryButton>
        </div>
      ) : null}

      {mode === "scenario" ? (
        <div className="flex flex-wrap items-end gap-2">
          <V2Field label="What-if name">
            <V2Input
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g. Prospect X — 2 VMCs"
            />
          </V2Field>
          <V2PrimaryButton
            type="button"
            onClick={() => {
              if (!scenarioName.trim()) return;
              saveAsScenario(scenarioName.trim());
              setMode("idle");
            }}
          >
            Save what-if
          </V2PrimaryButton>
          <V2SecondaryButton type="button" onClick={() => setMode("idle")}>
            Cancel
          </V2SecondaryButton>
        </div>
      ) : null}

      {mode === "baseline" ? (
        <div className="flex flex-wrap items-end gap-2">
          <V2Field label="Live name (optional)">
            <V2Input
              value={baselineName}
              onChange={(e) => setBaselineName(e.target.value)}
              placeholder="Optional name"
            />
          </V2Field>
          <V2PrimaryButton
            type="button"
            onClick={() => {
              adoptAsBaseline(baselineName.trim() || undefined);
              setMode("idle");
            }}
          >
            Make live
          </V2PrimaryButton>
          <V2SecondaryButton type="button" onClick={() => setMode("idle")}>
            Cancel
          </V2SecondaryButton>
        </div>
      ) : null}
    </div>
  );
}
