"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  History,
  ShieldCheck,
  X,
} from "lucide-react";
import { useDemoGraph } from "@/components/demo/DemoGraphProvider";
import { Button } from "@/components/ui/Primitives";
import { V2Field, V2Input } from "@/components/v2/V2Ui";
import type { BaselineChange } from "@/lib/factory/types";

function formatChangeValue(value: string | number, unit?: string) {
  if (typeof value === "string") return value;
  if (unit === "₹") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function ChangeRow({ change }: { change: BaselineChange }) {
  return (
    <li className="grid gap-2 border-b border-outline-variant/70 py-3 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="text-body-sm font-medium text-on-surface">{change.label}</p>
        <p className="truncate text-code-sm text-on-surface-variant">
          {change.entityName}
        </p>
      </div>
      <div className="flex items-center gap-2 font-mono text-code-sm tabular-nums">
        <span className="text-on-surface-variant">
          {formatChangeValue(change.previousValue, change.unit)}
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="font-bold text-on-surface">
          {formatChangeValue(change.nextValue, change.unit)}
        </span>
      </div>
    </li>
  );
}

export function BaselineAdoption() {
  const {
    activeBaseline,
    workingChanges,
    adoptBaseline,
    baselineVersions,
  } = useDemoGraph();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function beginAdoption() {
    setName(
      `Operating baseline · ${new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date())}`,
    );
    setNote("");
    setAttempted(false);
    setOpen(true);
  }

  function handleAdopt(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (!name.trim()) return;
    if (adoptBaseline(name, note)) setOpen(false);
  }

  if (workingChanges.length === 0) {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <div>
            <p className="text-body-sm font-medium text-on-surface">
              Working from: {activeBaseline.name}
            </p>
            <p className="text-code-sm text-on-surface-variant">
              No unadopted input changes
            </p>
          </div>
        </div>
        <Link
          href="/baselines"
          className="inline-flex min-h-11 items-center gap-2 rounded-sm px-3 text-body-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <History className="h-4 w-4" />
          View {baselineVersions.length} baseline
          {baselineVersions.length === 1 ? "" : "s"}
        </Link>
      </div>
    );
  }

  return (
    <>
      <motion.section
        layout
        className="relative mb-6 overflow-hidden rounded border border-primary/30 bg-surface-lowest shadow-industrial"
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={
            reducedMotion
              ? undefined
              : { x: ["-70%", "70%"], opacity: [0.35, 1, 0.35] }
          }
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-sm bg-primary/10 p-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-body-sm font-bold text-on-surface">
                {workingChanges.length} operating input
                {workingChanges.length === 1 ? "" : "s"} changed
              </p>
              <p className="mt-0.5 max-w-xl text-body-sm text-on-surface-variant">
                These remain a working simulation until you explicitly adopt
                them. Adoption updates every baseline comparison and creates an
                audit version.
              </p>
            </div>
          </div>
          <Button onClick={beginAdoption}>
            <ShieldCheck className="h-4 w-4" />
            Review &amp; adopt baseline
          </Button>
        </div>
      </motion.section>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="adopt-baseline-title"
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded border border-outline-variant bg-surface-lowest shadow-2xl"
              initial={
                reducedMotion ? false : { opacity: 0, scale: 0.98, y: 12 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: 6 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
            >
              <form noValidate onSubmit={handleAdopt}>
                <div className="flex items-start justify-between gap-4 border-b border-outline-variant p-5">
                  <div>
                    <h2
                      id="adopt-baseline-title"
                      className="text-headline-md text-on-surface"
                    >
                      Adopt new operating baseline
                    </h2>
                    <p className="mt-1 text-body-sm text-on-surface-variant">
                      The current values become the new comparison point. The
                      prior baseline remains in history.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close baseline review"
                    onClick={() => setOpen(false)}
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-sm text-on-surface-variant transition-colors hover:bg-surface-high hover:text-on-surface"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-5 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <V2Field
                      label="Baseline name"
                      required
                      error={
                        attempted && !name.trim() ? "Required" : null
                      }
                    >
                      <V2Input
                        autoFocus
                        invalid={attempted && !name.trim()}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </V2Field>
                    <V2Field label="Reason / note">
                      <V2Input
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="e.g. Tariff revision effective August"
                      />
                    </V2Field>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-headline-sm text-on-surface">
                        Changes being adopted
                      </h3>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-code-sm font-bold text-primary">
                        {workingChanges.length}
                      </span>
                    </div>
                    <ul className="rounded border border-outline-variant bg-surface-low/40 px-4">
                      {workingChanges.map((change) => (
                        <ChangeRow key={change.id} change={change} />
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant bg-surface-low/50 p-4">
                  <Button variant="secondary" onClick={() => setOpen(false)}>
                    Keep as working changes
                  </Button>
                  <Button type="submit">
                    <ShieldCheck className="h-4 w-4" />
                    Adopt as baseline
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
