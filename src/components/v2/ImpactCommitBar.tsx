"use client";

import { useState } from "react";
import Link from "next/link";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";
import {
  V2Field,
  V2PrimaryButton,
  V2SecondaryButton,
  V2Textarea,
} from "@/components/v2/V2Ui";

export function ImpactCommitBar() {
  const { isDirty, discard, adoptAsBaseline, saveAsScenario, draft } =
    useImpactDraft();
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"idle" | "scenario" | "baseline">("idle");
  const [attempted, setAttempted] = useState(false);
  const plantLabel = draft.plant.name.trim() || "Plant";
  const descriptionMissing = attempted && !description.trim();

  if (!isDirty) {
    return (
      <div className="sticky bottom-0 z-20 border-t border-outline-variant bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-body-sm text-on-surface-variant">
            No changes yet. Edit a cost area or add machines — insights update
            without touching your live factory.
          </p>
          <Link
            href="/master-data/audit"
            className="text-body-sm font-medium text-primary hover:underline"
          >
            Audit trail
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 z-20 border-t border-amber-700/30 bg-amber-50/95 px-4 py-3 backdrop-blur">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-body-sm font-medium text-amber-900">
          Exploring — live Factory Pulse is unchanged until you make this live.
        </p>
        <Link
          href="/master-data/audit"
          className="text-body-sm font-medium text-amber-900 underline decoration-amber-700/40 underline-offset-2 hover:decoration-amber-900"
        >
          Audit trail
        </Link>
      </div>
      {mode === "idle" ? (
        <div className="flex flex-wrap items-center gap-2">
          <V2SecondaryButton type="button" onClick={discard}>
            Discard
          </V2SecondaryButton>
          <V2SecondaryButton
            type="button"
            onClick={() => {
              setMode("scenario");
              setDescription("");
              setAttempted(false);
            }}
          >
            Save this what-if
          </V2SecondaryButton>
          <V2PrimaryButton
            type="button"
            onClick={() => {
              setMode("baseline");
              setDescription("");
              setAttempted(false);
            }}
          >
            Make this your live factory
          </V2PrimaryButton>
        </div>
      ) : null}

      {mode === "scenario" || mode === "baseline" ? (
        <div className="flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-[10rem]">
            <p className="label-caps text-amber-900/70">Plant</p>
            <p className="mt-1 text-body-md font-semibold text-on-surface">
              {plantLabel}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <V2Field
              label="Description"
              hint="What drove this impact? e.g. night-shift quote, +2 VMCs for prospect."
              required
              error={descriptionMissing ? "Required" : null}
            >
              <V2Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                invalid={descriptionMissing}
                placeholder="Why you are changing the plant…"
              />
            </V2Field>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <V2PrimaryButton
              type="button"
              onClick={() => {
                setAttempted(true);
                if (!description.trim()) return;
                if (mode === "scenario") saveAsScenario(description.trim());
                else adoptAsBaseline(description.trim());
                setDescription("");
                setAttempted(false);
                setMode("idle");
              }}
            >
              {mode === "scenario" ? "Save what-if" : "Make live"}
            </V2PrimaryButton>
            <V2SecondaryButton
              type="button"
              onClick={() => {
                setMode("idle");
                setDescription("");
                setAttempted(false);
              }}
            >
              Cancel
            </V2SecondaryButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
