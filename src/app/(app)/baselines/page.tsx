"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  RotateCcw,
  ShieldPlus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { SnapshotDiffPanel } from "@/components/v2/SnapshotDiffPanel";
import { V2Input, V2PrimaryButton, V2SecondaryButton } from "@/components/v2/V2Ui";
import { snapshotFromRecord } from "@/lib/v2/clientDb";
import { compareSnapshots } from "@/lib/v2/snapshotDiff";
import { formatInr } from "@/lib/costing";

export default function V2BaselinesPage() {
  const {
    record,
    activeBaseline,
    saveBaseline,
    restoreBaseline,
    deleteScenario,
  } = useV2Graph();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const liveSnap = useMemo(() => snapshotFromRecord(record), [record]);
  const versions = [...record.baselines].reverse();
  const scenarios = [...(record.scenarios ?? [])].reverse();
  /** Chronological ascending for “previous baseline” lookup */
  const baselinesAsc = record.baselines;

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    const created = saveBaseline(
      name ||
        `Operating baseline · ${new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date())}`,
      note,
    );
    if (created) {
      setName("");
      setNote("");
    }
  }

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function previousBaseline(id: string) {
    const idx = baselinesAsc.findIndex((b) => b.id === id);
    if (idx <= 0) return null;
    return baselinesAsc[idx - 1];
  }

  return (
    <div className="p-4 sm:p-8">
      <h2 className="text-headline-lg text-on-surface">Baselines & scenarios</h2>
      <p className="mt-1 max-w-2xl text-body-md text-on-surface-variant">
        Expand any card to see <strong>what changed</strong> and the{" "}
        <strong>Cash MHR impact</strong>. Scenarios compare to the live plant;
        baselines compare to the previous baseline (or live if first).
      </p>

      {activeBaseline ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-body-sm text-on-surface">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span>
            Active: <strong>{activeBaseline.name}</strong>
            <span className="text-on-surface-variant">
              {" "}
              · {new Date(activeBaseline.createdAt).toLocaleString("en-IN")}
            </span>
          </span>
          <Link href="/impact" className="ml-auto font-medium text-primary">
            Open Impact lab
          </Link>
        </div>
      ) : null}

      <form
        onSubmit={handleCreate}
        className="mt-6 max-w-xl space-y-3 rounded-2xl border border-outline-variant bg-surface-lowest p-5"
      >
        <div className="flex items-center gap-2 text-primary">
          <ShieldPlus className="h-5 w-5" />
          <p className="text-body-sm font-medium">Create new baseline</p>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Saves the <strong>current live plant state</strong>. Prefer Adopt as
          baseline from Impact after a what-if.
        </p>
        <label className="block">
          <span className="label-caps mb-1 block text-on-surface-variant">
            Name
          </span>
          <V2Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. After tariff hike · Jul 2026"
          />
        </label>
        <label className="block">
          <span className="label-caps mb-1 block text-on-surface-variant">
            Note (optional)
          </span>
          <V2Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What changed?"
          />
        </label>
        <V2PrimaryButton type="submit">Save baseline</V2PrimaryButton>
      </form>

      <div className="mt-8 space-y-3">
        <p className="flex items-center gap-2 text-body-sm font-medium text-on-surface">
          <Sparkles className="h-4 w-4" />
          Scenarios ({scenarios.length})
        </p>
        {scenarios.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">
            No scenarios yet. Change assumptions in Impact lab and choose Save
            as scenario.
          </p>
        ) : (
          scenarios.map((scenario) => {
            const open = expandedId === scenario.id;
            const summary = compareSnapshots(liveSnap, scenario.snapshot);
            const blendedDelta =
              summary.targetBlendedMhr - summary.referenceBlendedMhr;
            return (
              <div
                key={scenario.id}
                className="rounded-xl border border-outline-variant bg-surface-lowest p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-on-surface">
                      {scenario.name}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      {new Date(scenario.createdAt).toLocaleString("en-IN")} ·{" "}
                      {scenario.snapshot.machines.length} machines
                      {summary.sectionCount > 0 ? (
                        <>
                          {" "}
                          · {summary.sectionCount} section
                          {summary.sectionCount === 1 ? "" : "s"} vs live ·
                          blended MHR{" "}
                          {blendedDelta > 0 ? "+" : ""}
                          {formatInr(blendedDelta)}/hr
                        </>
                      ) : (
                        " · same as live"
                      )}
                    </p>
                    {scenario.note ? (
                      <p className="mt-1 text-body-sm text-on-surface-variant">
                        {scenario.note}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <V2SecondaryButton
                      type="button"
                      onClick={() => toggle(scenario.id)}
                    >
                      {open ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      {open ? "Hide impact" : "Show impact"}
                    </V2SecondaryButton>
                    <Link
                      href={`/impact?scenario=${scenario.id}`}
                      className="inline-flex min-h-11 items-center rounded-lg border border-outline-variant px-4 text-body-sm font-medium text-on-surface hover:bg-surface-low"
                    >
                      Open in Impact
                    </Link>
                    <V2SecondaryButton
                      type="button"
                      onClick={() => deleteScenario(scenario.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </V2SecondaryButton>
                  </div>
                </div>
                {open ? (
                  <SnapshotDiffPanel
                    reference={liveSnap}
                    target={scenario.snapshot}
                    referenceLabel="Live plant"
                    targetLabel={scenario.name}
                  />
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-8 space-y-3">
        <p className="flex items-center gap-2 text-body-sm font-medium text-on-surface">
          <History className="h-4 w-4" />
          Baseline history ({versions.length})
        </p>
        {versions.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">
            No baselines yet. Finish onboarding or save one above.
          </p>
        ) : (
          versions.map((version) => {
            const active = version.id === activeBaseline?.id;
            const open = expandedId === version.id;
            const prev = previousBaseline(version.id);
            const reference = prev?.snapshot ?? liveSnap;
            const referenceLabel = prev
              ? `Previous · ${prev.name}`
              : "Live plant";
            const summary = compareSnapshots(reference, version.snapshot);
            const blendedDelta =
              summary.targetBlendedMhr - summary.referenceBlendedMhr;

            return (
              <div
                key={version.id}
                className={`rounded-xl border p-4 ${
                  active
                    ? "border-primary/40 bg-primary/5"
                    : "border-outline-variant bg-surface-lowest"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-on-surface">
                      {version.name}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      {new Date(version.createdAt).toLocaleString("en-IN")} ·{" "}
                      {version.snapshot.machines.length} machines
                      {summary.sectionCount > 0 ? (
                        <>
                          {" "}
                          · vs {prev ? "previous" : "live"}:{" "}
                          {summary.sectionCount} section
                          {summary.sectionCount === 1 ? "" : "s"} · blended MHR{" "}
                          {blendedDelta > 0 ? "+" : ""}
                          {formatInr(blendedDelta)}/hr
                        </>
                      ) : null}
                    </p>
                    {version.note ? (
                      <p className="mt-1 text-body-sm text-on-surface-variant">
                        {version.note}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <V2SecondaryButton
                      type="button"
                      onClick={() => toggle(version.id)}
                    >
                      {open ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      {open ? "Hide impact" : "Show impact"}
                    </V2SecondaryButton>
                    {active ? (
                      <span className="inline-flex min-h-11 items-center rounded-full bg-primary/15 px-2.5 text-code-sm text-primary">
                        Active
                      </span>
                    ) : (
                      <V2SecondaryButton
                        type="button"
                        onClick={() => restoreBaseline(version.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </V2SecondaryButton>
                    )}
                  </div>
                </div>
                {open ? (
                  <SnapshotDiffPanel
                    reference={reference}
                    target={version.snapshot}
                    referenceLabel={referenceLabel}
                    targetLabel={version.name}
                  />
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
