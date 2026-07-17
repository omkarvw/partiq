"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Primitives";

export function CreatePartModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [material, setMaterial] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-labelledby="create-part-title"
        className="w-full max-w-md rounded border border-outline-variant bg-surface-lowest shadow-industrial"
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <h2 id="create-part-title" className="text-headline-sm text-on-surface">
            Create Part
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="cursor-pointer rounded-sm p-1 text-outline hover:text-on-surface"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          className="space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          <Field label="Part code" value={code} onChange={setCode} placeholder="MID-3060" required />
          <Field label="Name" value={name} onChange={setName} placeholder="Manifold housing" required />
          <Field label="Material" value={material} onChange={setMaterial} placeholder="EN1 Leaded" />
          <label className="block">
            <span className="label-caps mb-1 block text-on-surface-variant">Description</span>
            <textarea
              rows={3}
              className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-body-sm focus:border-primary"
              placeholder="Optional notes"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="label-caps mb-1 block text-on-surface-variant">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 font-mono text-code-md focus:border-primary"
      />
    </label>
  );
}

export function ConfirmDeleteModal({
  open,
  title,
  message,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-labelledby="delete-title"
        className="w-full max-w-sm rounded border border-outline-variant bg-surface-lowest shadow-industrial"
      >
        <div className="border-b border-outline-variant px-4 py-3">
          <h2 id="delete-title" className="text-headline-sm text-on-surface">
            {title}
          </h2>
        </div>
        <p className="p-4 text-body-md text-on-surface-variant">{message}</p>
        <div className="flex justify-end gap-2 border-t border-outline-variant px-4 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
