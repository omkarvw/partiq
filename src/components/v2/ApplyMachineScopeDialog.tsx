"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { V2SecondaryButton } from "@/components/v2/V2Ui";

export type MachineApplyScope = "machine" | "type";

/**
 * Confirm when adding/removing a machine-level field (e.g. custom utility).
 * Choose this machine only vs every machine of the same type.
 */
export function ApplyMachineScopeDialog({
  open,
  title,
  body,
  machineName,
  machineType,
  typeCount,
  /** When false (e.g. labour/tooling shared by type), only “all of type” is offered. */
  allowMachineOnly = true,
  onChoose,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  machineName: string;
  machineType: string;
  typeCount: number;
  allowMachineOnly?: boolean;
  onChoose: (scope: MachineApplyScope) => void;
  onClose: () => void;
}) {
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const showType = typeCount > 1 && Boolean(machineType);
  const showMachine = allowMachineOnly;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="apply-scope-title"
        aria-describedby="apply-scope-body"
        className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-lowest shadow-industrial"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant px-4 py-3">
          <h2
            id="apply-scope-title"
            className="text-headline-sm text-on-surface"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="cursor-pointer rounded-sm p-1 text-on-surface-variant hover:text-on-surface"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p
          id="apply-scope-body"
          className="px-4 py-4 text-body-md text-on-surface-variant"
        >
          {body}
        </p>
        <div className="flex flex-col gap-2 border-t border-outline-variant px-4 py-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <V2SecondaryButton type="button" onClick={onClose}>
            Cancel
          </V2SecondaryButton>
          {showMachine ? (
            <button
              ref={firstRef}
              type="button"
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-sm border border-outline-variant bg-surface-lowest px-4 text-body-sm font-medium text-on-surface hover:bg-surface-high"
              onClick={() => {
                onChoose("machine");
                onClose();
              }}
            >
              Only {machineName || "this machine"}
            </button>
          ) : null}
          {showType || !showMachine ? (
            <button
              ref={showMachine ? undefined : firstRef}
              type="button"
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-sm bg-primary px-4 text-body-sm font-medium text-on-primary hover:bg-primary/90"
              onClick={() => {
                onChoose("type");
                onClose();
              }}
            >
              All {machineType || "type"}
              {typeCount > 0 ? ` (${typeCount})` : ""}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
