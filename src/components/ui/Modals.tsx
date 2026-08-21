"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Primitives";
import { CustomFieldsEditor } from "@/components/ui/CustomFieldsEditor";
import { FormField, FormSelect } from "@/components/ui/FormField";
import { getAllCustomers, getCustomer } from "@/lib/data";
import type { CustomField, CustomerStatus } from "@/lib/types";
import { upsertCustomer, upsertPart } from "@/lib/commercial/entityStore";
import { markStory } from "@/components/story/StoryChecklist";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { getPart } from "@/lib/data";

export function CreatePartModal({
  open,
  onClose,
  defaultCustomerId,
  lockCustomer = false,
}: {
  open: boolean;
  onClose: () => void;
  /** Prefill primary customer (e.g. from customer detail). */
  defaultCustomerId?: string;
  /** Hide customer picker when creating from a customer page. */
  lockCustomer?: boolean;
}) {
  const router = useRouter();
  const { record } = useV2Graph();
  const defaultMachineId = record.machines[0]?.id;
  const activeCustomers = getAllCustomers().filter((c) => c.status === "Active");
  const lockedCustomer =
    lockCustomer && defaultCustomerId
      ? getCustomer(defaultCustomerId)
      : null;
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [material, setMaterial] = useState("");
  const [customerId, setCustomerId] = useState(
    defaultCustomerId ?? activeCustomers[0]?.id ?? "",
  );
  const [description, setDescription] = useState("");
  const [attempted, setAttempted] = useState(false);

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
          noValidate
          className="space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setAttempted(true);
            const customer =
              lockedCustomer ??
              getAllCustomers().find((c) => c.id === customerId) ??
              activeCustomers[0];
            if (!code.trim() || !name.trim() || !customer) return;
            const partId = `part-${Date.now()}`;
            const processId = `proc-${Date.now()}`;
            upsertPart({
              id: partId,
              code: code.trim().toUpperCase(),
              name: name.trim(),
              material: material.trim() || "—",
              customerId: customer.id,
              customer: customer.name,
              description,
              status: "Quoting",
              partFiles: [],
              processes: [
                {
                  id: processId,
                  name: "CNC 1 - Roughing",
                  description:
                    "Primary machining step — set times and attach G-code.",
                  sequence: 1,
                  currentVersion: 1,
                  versions: [
                    {
                      versionNumber: 1,
                      status: "current",
                      mhr: 0,
                      machineId: defaultMachineId,
                      timeUnit: "minutes",
                      timeEstimated: 0,
                      timeActual: 0,
                      customFields: [],
                      files: [],
                    },
                  ],
                },
              ],
            });
            markStory("create_part");
            onClose();
            router.push(`/parts/${partId}/processes/${processId}`);
            router.refresh();
          }}
        >
          <FormField
            label="Part code"
            value={code}
            onChange={setCode}
            placeholder="MID-3060"
            required
            attempted={attempted}
          />
          <FormField
            label="Name"
            value={name}
            onChange={setName}
            placeholder="Manifold housing"
            required
            attempted={attempted}
          />
          <FormField
            label="Material"
            value={material}
            onChange={setMaterial}
            placeholder="EN1 Leaded"
          />
          {lockedCustomer ? (
            <div>
              <p className="label-caps mb-1 text-on-surface-variant">
                Primary customer
              </p>
              <p className="text-body-sm font-medium text-on-surface">
                {lockedCustomer.code} — {lockedCustomer.name}
              </p>
            </div>
          ) : (
            <FormSelect
              label="Customer"
              value={customerId}
              onChange={setCustomerId}
              required
              attempted={attempted}
            >
              {activeCustomers.length === 0 ? (
                <option value="" disabled>
                  Create a customer first
                </option>
              ) : (
                activeCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))
              )}
            </FormSelect>
          )}
          <label className="block">
            <span className="label-caps mb-1 block text-on-surface-variant">
              Description
            </span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-body-sm focus:border-primary"
              placeholder="Optional notes"
            />
          </label>
          {record.machines.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">
              Add a machine on Factory first — process cost uses live Cash MHR.
            </p>
          ) : (
            <p className="text-[11px] text-on-surface-variant">
              First process links to{" "}
              <span className="font-medium text-on-surface">
                {record.machines[0]?.name}
              </span>
              . Change it on the process page.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!lockedCustomer && activeCustomers.length === 0}
            >
              <Plus className="h-4 w-4" />
              Create Part
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddProcessModal({
  open,
  partId,
  onClose,
}: {
  open: boolean;
  partId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { record } = useV2Graph();
  const part = getPart(partId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [machineId, setMachineId] = useState(record.machines[0]?.id ?? "");
  const [attempted, setAttempted] = useState(false);

  if (!open || !part) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-labelledby="add-process-title"
        className="w-full max-w-md rounded border border-outline-variant bg-surface-lowest shadow-industrial"
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <h2 id="add-process-title" className="text-headline-sm text-on-surface">
            Add process step
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
          noValidate
          className="space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setAttempted(true);
            const live = getPart(partId);
            if (!live || !name.trim() || !machineId) return;
            const processId = `proc-${Date.now()}`;
            const sequence =
              live.processes.reduce((max, p) => Math.max(max, p.sequence), 0) +
              1;
            upsertPart({
              ...live,
              processes: [
                ...live.processes,
                {
                  id: processId,
                  name: name.trim() || `CNC ${sequence}`,
                  description:
                    description.trim() ||
                    "Machining step — set times and attach G-code.",
                  sequence,
                  currentVersion: 1,
                  versions: [
                    {
                      versionNumber: 1,
                      status: "current",
                      mhr: 0,
                      machineId: machineId || undefined,
                      timeUnit: "minutes",
                      timeEstimated: 0,
                      timeActual: 0,
                      customFields: [],
                      files: [],
                    },
                  ],
                },
              ],
            });
            onClose();
            router.push(`/parts/${partId}/processes/${processId}`);
            router.refresh();
          }}
        >
          <FormField
            label="Process name"
            value={name}
            onChange={setName}
            placeholder="CNC 2 - Finishing"
            required
            attempted={attempted}
          />
          <FormSelect
            label="Factory machine"
            value={machineId}
            onChange={setMachineId}
            required
            attempted={attempted}
          >
            {record.machines.length === 0 ? (
              <option value="" disabled>
                Add a machine on Factory first
              </option>
            ) : (
              record.machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.type}
                </option>
              ))
            )}
          </FormSelect>
          <p className="-mt-2 text-[11px] text-on-surface-variant">
            Cash MHR comes from this live factory machine.
          </p>
          <label className="block">
            <span className="label-caps mb-1 block text-on-surface-variant">
              Description
            </span>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-body-sm focus:border-primary"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={record.machines.length === 0}>
              <Plus className="h-4 w-4" />
              Add process
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateCustomerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<CustomerStatus>("Active");
  const [notes, setNotes] = useState("");
  const [fields, setFields] = useState<CustomField[]>([]);
  const [attempted, setAttempted] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-labelledby="create-customer-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded border border-outline-variant bg-surface-lowest shadow-industrial"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant bg-surface-lowest px-4 py-3">
          <h2
            id="create-customer-title"
            className="text-headline-sm text-on-surface"
          >
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
          noValidate
          className="space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setAttempted(true);
            if (!code.trim() || !name.trim()) return;
            upsertCustomer({
              id: `cust-${Date.now()}`,
              code:
                code.trim() ||
                `CUST-${Date.now().toString(36).toUpperCase()}`,
              name: name.trim(),
              contactName,
              email,
              phone,
              city,
              status,
              notes,
              createdAt: new Date().toISOString().slice(0, 10),
              customFields: fields,
            });
            markStory("create_customer");
            onClose();
            router.push("/customers");
            router.refresh();
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Customer code"
              value={code}
              onChange={setCode}
              placeholder="CUST-XXX"
              required
              attempted={attempted}
            />
            <FormField
              label="Name"
              value={name}
              onChange={setName}
              placeholder="Company name"
              required
              attempted={attempted}
            />
            <FormField
              label="Contact"
              value={contactName}
              onChange={setContactName}
              placeholder="Primary contact"
            />
            <FormField
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="ops@example.com"
            />
            <FormField
              label="Phone"
              value={phone}
              onChange={setPhone}
              placeholder="+91 …"
            />
            <FormField
              label="City"
              value={city}
              onChange={setCity}
              placeholder="Mumbai"
            />
            <FormSelect
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as CustomerStatus)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </FormSelect>
          </div>
          <label className="block">
            <span className="label-caps mb-1 block text-on-surface-variant">
              Notes
            </span>
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
