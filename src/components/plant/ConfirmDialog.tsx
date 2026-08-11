"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { V2SecondaryButton } from "@/components/v2/V2Ui";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onClose: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-lowest shadow-industrial"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant px-4 py-3">
          <h2 id="confirm-title" className="text-headline-sm text-on-surface">
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
        <p id="confirm-body" className="px-4 py-4 text-body-md text-on-surface-variant">
          {body}
        </p>
        <div className="flex justify-end gap-2 border-t border-outline-variant px-4 py-3">
          <V2SecondaryButton type="button" onClick={onClose}>
            {cancelLabel}
          </V2SecondaryButton>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={
              tone === "danger"
                ? "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-sm bg-error px-5 text-body-sm font-medium text-on-error shadow-sm transition duration-200 hover:bg-error/90 active:scale-[0.98]"
                : "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-sm bg-primary px-5 text-body-sm font-medium text-on-primary shadow-sm transition duration-200 hover:bg-primary/90 active:scale-[0.98]"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
