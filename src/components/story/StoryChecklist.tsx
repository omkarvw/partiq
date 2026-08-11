"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp, ListChecks, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import {
  STORY_STEPS,
  completeStoryStep,
  getCommercialMode,
  readStoryProgress,
  writeStoryProgress,
  type StoryProgress,
  type StoryStepId,
} from "@/lib/commercial/entityStore";
import {
  getAllCustomers,
  getAllParts,
  getAllQuotations,
} from "@/lib/data";

function syncAutoComplete(onboarded: boolean, machineCount: number) {
  if (onboarded) completeStoryStep("setup_plant");
  if (machineCount > 0) completeStoryStep("add_machine");
  if (getAllCustomers().length > 0) completeStoryStep("create_customer");
  const parts = getAllParts();
  if (parts.length > 0) completeStoryStep("create_part");
  const hasTimes = parts.some((p) =>
    p.processes.some((proc) => {
      const v =
        proc.versions.find((x) => x.versionNumber === proc.currentVersion) ??
        proc.versions[0];
      return v && (v.timeEstimated > 0 || v.timeActual > 0);
    }),
  );
  if (hasTimes) completeStoryStep("process_times");
  const hasGcode = parts.some((p) =>
    p.processes.some((proc) =>
      proc.versions.some((v) => v.files.some((f) => f.kind === "gcode")),
    ),
  );
  if (hasGcode) completeStoryStep("attach_gcode");
  if (getAllQuotations().some((q) => q.status !== "Inactive")) {
    completeStoryStep("create_quote");
  }
}

export function StoryChecklist() {
  const pathname = usePathname();
  const { onboarded, record } = useV2Graph();
  const [open, setOpen] = useState(true);
  const [progress, setProgress] = useState<StoryProgress | null>(null);
  const [mode, setMode] = useState(getCommercialMode());

  const refresh = useCallback(() => {
    setMode(getCommercialMode());
    syncAutoComplete(onboarded, record.machines.length);
    setProgress(readStoryProgress());
  }, [onboarded, record.machines.length]);

  useEffect(() => {
    refresh();
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("partiq-story-refresh", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("partiq-story-refresh", onStorage);
    };
  }, [refresh, pathname]);

  const doneCount = useMemo(() => {
    if (!progress) return 0;
    return STORY_STEPS.filter((s) => progress.completed[s.id]).length;
  }, [progress]);

  if (mode !== "story" || !progress || progress.dismissed) return null;
  if (pathname.startsWith("/welcome") || pathname.startsWith("/tour")) {
    return null;
  }

  const next = STORY_STEPS.find((s) => !progress.completed[s.id]);
  const allDone = doneCount >= STORY_STEPS.length;

  return (
    <div className="fixed bottom-4 right-4 z-[90] w-[min(100vw-2rem,340px)]">
      <div className="card-surface overflow-hidden rounded-2xl border border-outline-variant bg-surface-lowest shadow-industrial">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="press flex w-full items-center gap-2 px-4 py-3 text-left"
        >
          <ListChecks className="h-4 w-4 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-semibold text-on-surface">
              Guided story
            </p>
            <p className="text-[11px] text-on-surface-variant">
              {allDone
                ? "Activation complete"
                : `${doneCount} of ${STORY_STEPS.length} · next: ${next?.title ?? "—"}`}
            </p>
          </div>
          {open ? (
            <ChevronDown className="h-4 w-4 text-on-surface-variant" />
          ) : (
            <ChevronUp className="h-4 w-4 text-on-surface-variant" />
          )}
        </button>

        {open ? (
          <div className="border-t border-outline-variant px-3 py-3">
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-high">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{
                  width: `${(doneCount / STORY_STEPS.length) * 100}%`,
                }}
              />
            </div>
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {STORY_STEPS.map((step) => {
                const done = Boolean(progress.completed[step.id]);
                const isNext = next?.id === step.id;
                return (
                  <li key={step.id}>
                    <Link
                      href={step.href}
                      className={`press flex items-start gap-2 rounded-lg px-2 py-2 ${
                        isNext
                          ? "bg-primary/10"
                          : done
                            ? "opacity-70"
                            : "hover:bg-surface-low"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          done
                            ? "bg-primary text-on-primary"
                            : "border border-outline-variant"
                        }`}
                      >
                        {done ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-medium text-on-surface">
                          {step.title}
                        </span>
                        <span className="block text-[11px] text-on-surface-variant">
                          {step.body}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-on-surface-variant hover:bg-surface-low"
              onClick={() => {
                writeStoryProgress({ ...progress, dismissed: true });
                setProgress(readStoryProgress());
              }}
            >
              <X className="h-3 w-3" /> Dismiss checklist
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function markStory(id: StoryStepId) {
  completeStoryStep(id);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("partiq-story-refresh"));
  }
}
