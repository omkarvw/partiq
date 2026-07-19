"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Primitives";
import { CustomFieldsEditor } from "@/components/ui/CustomFieldsEditor";
import { customers } from "@/lib/data";
import type { CustomField, CustomerStatus } from "@/lib/types";

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
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");

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
            <span className="label-caps mb-1 block text-on-surface-variant">Customer *</span>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full cursor-pointer rounded-sm border border-outline-variant bg-surface px-3 py-2 font-mono text-code-md focus:border-primary"
            >
              {customers
                .filter((c) => c.status === "Active")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
            </select>
          </label>
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

export function CreateCustomerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<CustomerStatus>("Active");
  const [notes, setNotes] = useState("");
  const [fields, setFields] = useState<CustomField[]>([]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-labelledby="create-customer-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded border border-outline-variant bg-surface-lowest shadow-industrial"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant bg-surface-lowest px-4 py-3">
          <h2 id="create-customer-title" className="text-headline-sm text-on-surface">
            New Customer
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Customer code" value={code} onChange={setCode} placeholder="CUST-XXX" required />
            <Field label="Name" value={name} onChange={setName} placeholder="Company name" required />
            <Field label="Contact" value={contactName} onChange={setContactName} placeholder="Primary contact" />
            <Field label="Email" value={email} onChange={setEmail} placeholder="ops@example.com" />
            <Field label="Phone" value={phone} onChange={setPhone} placeholder="+91 …" />
            <Field label="City" value={city} onChange={setCity} placeholder="Mumbai" />
            <label className="block">
              <span className="label-caps mb-1 block text-on-surface-variant">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                className="w-full cursor-pointer rounded-sm border border-outline-variant bg-surface px-3 py-2 font-mono text-code-md focus:border-primary"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="label-caps mb-1 block text-on-surface-variant">Notes</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-body-sm focus:border-primary"
            />
          </label>
          <CustomFieldsEditor fields={fields} onChange={setFields} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Save Customer
            </Button>
          </div>
        </form>
      </div>
    </div>
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
