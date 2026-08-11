"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Primitives";
import { CustomFieldsEditor } from "@/components/ui/CustomFieldsEditor";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  getAllCustomers,
  getEnquiry,
  getPart,
} from "@/lib/data";
import {
  upsertEnquiry,
  addQuotation,
} from "@/lib/commercial/entityStore";
import { markStory } from "@/components/story/StoryChecklist";
import type {
  CustomField,
  EnquiryStatus,
  QuotationStatus,
  ResponseOutcome,
} from "@/lib/types";

function ModalShell({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-labelledby="commercial-modal-title"
        className={`max-h-[90vh] w-full overflow-y-auto rounded border border-outline-variant bg-surface-lowest shadow-industrial ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant bg-surface-lowest px-4 py-3">
          <h2 id="commercial-modal-title" className="text-headline-sm text-on-surface">
            {title}
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
        {children}
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
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="label-caps mb-1 block text-on-surface-variant">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 font-mono text-code-md focus:border-primary"
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <label className="block">
      <span className="label-caps mb-1 block text-on-surface-variant">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full cursor-pointer rounded-sm border border-outline-variant bg-surface px-3 py-2 font-mono text-code-md focus:border-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function CustomerSelect({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}) {
  const active = getAllCustomers().filter((c) => c.status === "Active");
  return (
    <label className="block">
      <span className="label-caps mb-1 block text-on-surface-variant">
        Customer{required ? " *" : ""}
      </span>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer rounded-sm border border-outline-variant bg-surface px-3 py-2 font-mono text-code-md focus:border-primary"
      >
        <option value="">Select customer…</option>
        {active.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} — {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CreateEnquiryModal({
  open,
  onClose,
  partId,
  defaultCustomerId,
}: {
  open: boolean;
  onClose: () => void;
  partId: string;
  defaultCustomerId?: string;
}) {
  const router = useRouter();
  const part = getPart(partId);
  const [reference, setReference] = useState("");
  const [customerId, setCustomerId] = useState(
    defaultCustomerId ?? part?.customerId ?? "",
  );
  const [quantity, setQuantity] = useState("1");
  const [neededBy, setNeededBy] = useState("");
  const [quoteBy, setQuoteBy] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<EnquiryStatus>("New");
  const [fields, setFields] = useState<CustomField[]>([]);

  if (!open || !part) return null;

  return (
    <ModalShell title="New Enquiry (RFQ)" onClose={onClose} wide>
      <form
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const customer = getAllCustomers().find((c) => c.id === customerId);
          if (!customer) return;
          upsertEnquiry({
            id: `enq-${Date.now()}`,
            partId: part.id,
            reference: reference.trim() || `ENQ-${Date.now()}`,
            customerId: customer.id,
            customer: customer.name,
            quantity: Number(quantity) || 1,
            neededBy,
            quoteBy,
            notes,
            status,
            createdAt: new Date().toISOString().slice(0, 10),
            createdBy: "You",
            customFields: fields,
          });
          onClose();
          router.refresh();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("partiq-story-refresh"));
          }
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Reference"
            value={reference}
            onChange={setReference}
            placeholder="ENQ-2026-070"
            required
          />
          <CustomerSelect
            value={customerId}
            onChange={setCustomerId}
            required
          />
          <Field
            label="Quantity"
            value={quantity}
            onChange={setQuantity}
            type="number"
            required
          />
          <SelectField
            label="Status"
            value={status}
            onChange={setStatus}
            options={["New", "In Review", "Quoted", "Closed"] as const}
          />
          <DatePicker label="Needed by" value={neededBy} onChange={setNeededBy} />
          <DatePicker label="Quote by" value={quoteBy} onChange={setQuoteBy} />
        </div>
        <label className="block">
          <span className="label-caps mb-1 block text-on-surface-variant">Notes</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-body-sm focus:border-primary"
            placeholder="Specs, packaging, special requirements…"
          />
        </label>
        <CustomFieldsEditor fields={fields} onChange={setFields} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Plus className="h-4 w-4" />
            Save Enquiry
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

export function CreateQuotationModal({
  open,
  onClose,
  enquiryOptions,
  defaultEnquiryId,
  partId: partIdProp,
}: {
  open: boolean;
  onClose: () => void;
  enquiryOptions: { id: string; label: string }[];
  defaultEnquiryId?: string;
  partId?: string;
}) {
  const router = useRouter();
  const [enquiryId, setEnquiryId] = useState(
    defaultEnquiryId ?? enquiryOptions[0]?.id ?? "",
  );
  const [quoteNumber, setQuoteNumber] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [leadTimeDays, setLeadTimeDays] = useState("14");
  const [validUntil, setValidUntil] = useState("");
  const [terms, setTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<QuotationStatus>("Draft");
  const [fields, setFields] = useState<CustomField[]>([]);

  if (!open) return null;

  return (
    <ModalShell title="New Quotation" onClose={onClose} wide>
      <form
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const enquiry = getEnquiry(enquiryId);
          const partId = partIdProp ?? enquiry?.partId;
          if (!partId || !enquiry) return;
          const quoteId = `quo-${Date.now()}`;
          addQuotation({
            id: quoteId,
            partId,
            enquiryId,
            quoteNumber: quoteNumber.trim() || `Q-${Date.now()}`,
            unitPrice: Number(unitPrice) || 0,
            currency: "INR",
            quantity: Number(quantity) || 1,
            leadTimeDays: Number(leadTimeDays) || 14,
            validUntil:
              validUntil ||
              new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            terms: terms || "Net 30 · Ex-works",
            notes,
            status,
            createdAt: new Date().toISOString().slice(0, 10),
            createdBy: "You",
            customFields: fields,
          });
          markStory("create_quote");
          onClose();
          router.push(`/parts/${partId}/quotations/${quoteId}`);
          router.refresh();
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="label-caps mb-1 block text-on-surface-variant">
              Enquiry *
            </span>
            <select
              required
              value={enquiryId}
              onChange={(e) => setEnquiryId(e.target.value)}
              className="w-full cursor-pointer rounded-sm border border-outline-variant bg-surface px-3 py-2 font-mono text-code-md focus:border-primary"
            >
              {enquiryOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Quote number"
            value={quoteNumber}
            onChange={setQuoteNumber}
            placeholder="Q-2026-000-A"
            required
          />
          <SelectField
            label="Status"
            value={status}
            onChange={setStatus}
            options={["Draft", "Sent", "Inactive"] as const}
          />
          <Field
            label="Unit price (₹)"
            value={unitPrice}
            onChange={setUnitPrice}
            type="number"
            required
          />
          <Field
            label="Quantity"
            value={quantity}
            onChange={setQuantity}
            type="number"
            required
          />
          <Field
            label="Lead time (days)"
            value={leadTimeDays}
            onChange={setLeadTimeDays}
            type="number"
          />
          <DatePicker
            label="Valid until"
            value={validUntil}
            onChange={setValidUntil}
          />
        </div>
        <Field
          label="Terms"
          value={terms}
          onChange={setTerms}
          placeholder="Net 30 · Ex-works…"
        />
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
          <Button type="submit" disabled={enquiryOptions.length === 0}>
            <Plus className="h-4 w-4" />
            Save Quotation
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

export function CreateResponseModal({
  open,
  onClose,
  quotationOptions,
  defaultQuotationId,
}: {
  open: boolean;
  onClose: () => void;
  quotationOptions: { id: string; label: string }[];
  defaultQuotationId?: string;
}) {
  const [quotationId, setQuotationId] = useState(
    defaultQuotationId ?? quotationOptions[0]?.id ?? "",
  );
  const [outcome, setOutcome] = useState<ResponseOutcome>("Accepted");
  const [respondedAt, setRespondedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [revisedQty, setRevisedQty] = useState("");
  const [counterPrice, setCounterPrice] = useState("");
  const [fields, setFields] = useState<CustomField[]>([]);

  if (!open) return null;

  return (
    <ModalShell title="Log Customer Response" onClose={onClose} wide>
      <form
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="label-caps mb-1 block text-on-surface-variant">
              Quotation *
            </span>
            <select
              required
              value={quotationId}
              onChange={(e) => setQuotationId(e.target.value)}
              className="w-full cursor-pointer rounded-sm border border-outline-variant bg-surface px-3 py-2 font-mono text-code-md focus:border-primary"
            >
              {quotationOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <SelectField
            label="Outcome"
            value={outcome}
            onChange={setOutcome}
            options={["Accepted", "Rejected", "Negotiate", "No Response"] as const}
          />
          <DatePicker
            label="Responded at"
            value={respondedAt}
            onChange={setRespondedAt}
          />
          <Field
            label="Revised qty"
            value={revisedQty}
            onChange={setRevisedQty}
            type="number"
            placeholder="Optional"
          />
          <Field
            label="Counter price (₹)"
            value={counterPrice}
            onChange={setCounterPrice}
            type="number"
            placeholder="Optional"
          />
        </div>
        <label className="block">
          <span className="label-caps mb-1 block text-on-surface-variant">Notes</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-body-sm focus:border-primary"
            placeholder="Customer feedback, next steps…"
          />
        </label>
        <CustomFieldsEditor fields={fields} onChange={setFields} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Plus className="h-4 w-4" />
            Save Response
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
