"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Primitives";
import { CustomFieldsEditor } from "@/components/ui/CustomFieldsEditor";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormField, FormSelect } from "@/components/ui/FormField";
import {
  getAllCustomers,
  getAllParts,
  getCustomer,
  getEnquiry,
  getPart,
  getQuotation,
} from "@/lib/data";
import {
  upsertEnquiry,
  addQuotation,
  addCustomerResponse,
  upsertPart,
} from "@/lib/commercial/entityStore";
import { markStory } from "@/components/story/StoryChecklist";
import type {
  CustomField,
  EnquiryStatus,
  QuotationStatus,
  ResponseOutcome,
} from "@/lib/types";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { computePartEconomics } from "@/lib/factory/selectors";
import { actorDisplayName, readSessionActor } from "@/lib/v2/sessionActor";

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
    <FormSelect
      label={label}
      value={value}
      onChange={(v) => onChange(v as T)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </FormSelect>
  );
}

export function CreateEnquiryModal({
  open,
  onClose,
  partId: partIdProp,
  defaultCustomerId,
  lockCustomer = false,
}: {
  open: boolean;
  onClose: () => void;
  /** When set, RFQ is for this part. When omitted, user must pick a part. */
  partId?: string;
  defaultCustomerId?: string;
  /** Lock customer field (e.g. creating RFQ from a customer page). */
  lockCustomer?: boolean;
}) {
  const router = useRouter();
  const [selectedPartId, setSelectedPartId] = useState(partIdProp ?? "");
  const part = getPart(selectedPartId);
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
  const [attempted, setAttempted] = useState(false);

  if (!open) return null;

  const partChoices = getAllParts().filter((p) => p.status !== "Inactive");

  return (
    <ModalShell title="New Enquiry (RFQ)" onClose={onClose} wide>
      <form
        noValidate
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setAttempted(true);
          const livePart = getPart(selectedPartId);
          const customer = getAllCustomers().find((c) => c.id === customerId);
          if (
            !livePart ||
            !reference.trim() ||
            !customer ||
            !(Number(quantity) > 0)
          ) {
            return;
          }
          const enquiryId = `enq-${Date.now()}`;
          upsertEnquiry({
            id: enquiryId,
            partId: livePart.id,
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
          router.push(`/parts/${livePart.id}/enquiries/${enquiryId}`);
          router.refresh();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("partiq-story-refresh"));
          }
        }}
      >
        <p className="rounded-sm border border-outline-variant bg-surface-low/50 px-3 py-2 text-[12px] text-on-surface-variant">
          An RFQ always belongs to one part and one customer. Pick the part
          you are quoting, then the buyer.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {partIdProp ? (
            <div className="sm:col-span-2">
              <p className="label-caps mb-1 text-on-surface-variant">Part</p>
              <p className="font-mono text-code-md text-on-surface">
                {part?.code ?? partIdProp} · {part?.name}
              </p>
            </div>
          ) : (
            <FormSelect
              className="sm:col-span-2"
              label="Part"
              value={selectedPartId}
              onChange={setSelectedPartId}
              required
              attempted={attempted}
            >
              <option value="">Select part…</option>
              {partChoices.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </FormSelect>
          )}
          <FormField
            label="Reference"
            value={reference}
            onChange={setReference}
            placeholder="ENQ-2026-070"
            required
            attempted={attempted}
          />
          {lockCustomer ? (
            <div>
              <p className="label-caps mb-1 text-on-surface-variant">
                Customer
              </p>
              <p className="text-body-sm font-medium text-on-surface">
                {getCustomer(customerId)?.name ?? "—"}
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
              <option value="">Select customer…</option>
              {getAllCustomers()
                .filter((c) => c.status === "Active")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
            </FormSelect>
          )}
          <FormField
            label="Quantity"
            value={quantity}
            onChange={setQuantity}
            type="number"
            required
            attempted={attempted}
            error={
              attempted && !(Number(quantity) > 0)
                ? "Enter a quantity greater than 0"
                : null
            }
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
          <Button type="submit" disabled={partChoices.length === 0 && !partIdProp}>
            <Plus className="h-4 w-4" />
            Save Enquiry
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

/** Set a part’s primary customer (master link on the part). */
export function LinkPartToCustomerModal({
  open,
  onClose,
  customerId,
  onCreateNewPart,
}: {
  open: boolean;
  onClose: () => void;
  customerId: string;
  /** Opens create-part with this customer as primary. */
  onCreateNewPart?: () => void;
}) {
  const router = useRouter();
  const customer = getCustomer(customerId);
  const [partId, setPartId] = useState("");
  const [attempted, setAttempted] = useState(false);

  if (!open || !customer) return null;

  const candidates = getAllParts().filter(
    (p) => p.status !== "Inactive" && p.customerId !== customerId,
  );

  return (
    <ModalShell title={`Link part → ${customer.name}`} onClose={onClose}>
      <form
        noValidate
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setAttempted(true);
          const part = getPart(partId);
          if (!part) return;
          upsertPart({
            ...part,
            customerId: customer.id,
            customer: customer.name,
          });
          onClose();
          router.refresh();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("partiq-story-refresh"));
          }
        }}
      >
        <p className="text-body-sm text-on-surface-variant">
          Sets this customer as the part&apos;s <strong>primary</strong> buyer.
          To quote without changing primary, use New RFQ and pick the part.
        </p>
        <FormSelect
          label="Part"
          value={partId}
          onChange={setPartId}
          required
          attempted={attempted}
        >
          <option value="">Select part…</option>
          {candidates.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
              {p.customer ? ` (now: ${p.customer})` : ""}
            </option>
          ))}
        </FormSelect>
        {candidates.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">
            No other parts to re-link. Create a new part for this customer
            instead.
          </p>
        ) : null}
        {onCreateNewPart ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateNewPart();
            }}
            className="w-full rounded-sm border border-dashed border-outline-variant px-3 py-2.5 text-left text-body-sm font-medium text-primary hover:border-primary hover:bg-primary/5"
          >
            + Create new part for {customer.name}
          </button>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={candidates.length === 0}>
            <Plus className="h-4 w-4" />
            Link as primary
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
  const { breakups, record } = useV2Graph();
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
  const [attempted, setAttempted] = useState(false);

  if (!open) return null;

  return (
    <ModalShell title="New Quotation" onClose={onClose} wide>
      <form
        noValidate
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setAttempted(true);
          const enquiry = getEnquiry(enquiryId);
          const partId = partIdProp ?? enquiry?.partId;
          if (
            !partId ||
            !enquiry ||
            !quoteNumber.trim() ||
            !(Number(unitPrice) > 0) ||
            !(Number(quantity) > 0)
          ) {
            return;
          }
          const quoteId = `quo-${Date.now()}`;
          const eco = computePartEconomics(
            partId,
            breakups,
            record.machines,
            record.materialGrades ?? [],
          );
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
            costBasis: eco?.totalCost,
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
          <FormSelect
            className="sm:col-span-2"
            label="Enquiry"
            value={enquiryId}
            onChange={setEnquiryId}
            required
            attempted={attempted}
          >
            {enquiryOptions.length === 0 ? (
              <option value="" disabled>
                Create an enquiry first
              </option>
            ) : (
              enquiryOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))
            )}
          </FormSelect>
          <FormField
            label="Quote number"
            value={quoteNumber}
            onChange={setQuoteNumber}
            placeholder="Q-2026-000-A"
            required
            attempted={attempted}
          />
          <SelectField
            label="Status"
            value={status}
            onChange={setStatus}
            options={["Draft", "Sent", "Inactive"] as const}
          />
          <FormField
            label="Unit price (₹)"
            value={unitPrice}
            onChange={setUnitPrice}
            type="number"
            required
            attempted={attempted}
            error={
              attempted && !(Number(unitPrice) > 0)
                ? "Enter a unit price greater than 0"
                : null
            }
          />
          <FormField
            label="Quantity"
            value={quantity}
            onChange={setQuantity}
            type="number"
            required
            attempted={attempted}
            error={
              attempted && !(Number(quantity) > 0)
                ? "Enter a quantity greater than 0"
                : null
            }
          />
          <FormField
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
        <FormField
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
  const router = useRouter();
  const [quotationId, setQuotationId] = useState(
    defaultQuotationId ?? quotationOptions[0]?.id ?? "",
  );
  const [outcome, setOutcome] = useState<ResponseOutcome>("Accepted");
  const [respondedAt, setRespondedAt] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [revisedQty, setRevisedQty] = useState("");
  const [counterPrice, setCounterPrice] = useState("");
  const [fields, setFields] = useState<CustomField[]>([]);
  const [attempted, setAttempted] = useState(false);

  if (!open) return null;

  return (
    <ModalShell title="Log Customer Response" onClose={onClose} wide>
      <form
        noValidate
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setAttempted(true);
          const quote = getQuotation(quotationId);
          if (!quotationId || !quote) return;
          const actor = readSessionActor();
          const responseId = `resp-${Date.now()}`;
          addCustomerResponse({
            id: responseId,
            partId: quote.partId,
            quotationId: quote.id,
            outcome,
            respondedAt:
              respondedAt || new Date().toISOString().slice(0, 10),
            notes: notes.trim(),
            revisedQty:
              revisedQty.trim() !== ""
                ? Number(revisedQty) || undefined
                : undefined,
            counterPrice:
              counterPrice.trim() !== ""
                ? Number(counterPrice) || undefined
                : undefined,
            createdBy: actorDisplayName(actor),
            customFields: fields,
          });
          onClose();
          router.push(`/parts/${quote.partId}/responses/${responseId}`);
          router.refresh();
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            className="sm:col-span-2"
            label="Quotation"
            value={quotationId}
            onChange={setQuotationId}
            required
            attempted={attempted}
            error={
              attempted && quotationId && !getQuotation(quotationId)
                ? "Quotation not found"
                : null
            }
          >
            {quotationOptions.length === 0 ? (
              <option value="" disabled>
                Create a quotation first
              </option>
            ) : (
              quotationOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))
            )}
          </FormSelect>
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
          <FormField
            label="Revised qty"
            value={revisedQty}
            onChange={setRevisedQty}
            type="number"
            placeholder="Optional"
          />
          <FormField
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
          <Button type="submit" disabled={quotationOptions.length === 0}>
            <Plus className="h-4 w-4" />
            Save Response
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
