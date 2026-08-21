"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Primitives";
import { FormField, FormSelect } from "@/components/ui/FormField";
import { formatInr } from "@/lib/costing";
import {
  getEnquiriesForPart,
  getPart,
  getQuotationsForPart,
} from "@/lib/data";
import {
  addQuotation,
  nextRescueQuoteNumber,
  priceForTargetGrossMargin,
  supersedeQuotationInOverlay,
} from "@/lib/commercial/entityStore";
import { markStory } from "@/components/story/StoryChecklist";
import type { Quotation } from "@/lib/types";

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-labelledby="rescue-quote-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-outline-variant bg-surface-lowest shadow-industrial"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant bg-surface-lowest px-4 py-3">
          <h2
            id="rescue-quote-title"
            className="text-headline-sm text-on-surface"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded px-2 py-1 text-body-sm text-on-surface-variant hover:bg-surface-low"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Create goal-priced drafts for every active quote/enquiry on the part. */
export function createRescueQuotesForPart(opts: {
  partId: string;
  costBasis: number;
  targetGrossMarginPct: number;
  unitPrice?: number;
}): Quotation[] {
  const part = getPart(opts.partId);
  if (!part) return [];
  const price =
    opts.unitPrice ??
    priceForTargetGrossMargin(opts.costBasis, opts.targetGrossMarginPct);
  const active = getQuotationsForPart(opts.partId).filter(
    (q) => q.status === "Sent" || q.status === "Draft",
  );
  const enquiries =
    active.length > 0
      ? active
      : getEnquiriesForPart(opts.partId).map((e) => ({
          id: `virtual-${e.id}`,
          partId: opts.partId,
          enquiryId: e.id,
          quoteNumber: "",
          unitPrice: 0,
          currency: "INR",
          quantity: e.quantity,
          leadTimeDays: 21,
          validUntil: "",
          terms: "Net 30 · Ex-works",
          notes: "",
          status: "Draft" as const,
          createdAt: "",
          createdBy: "",
          customFields: [],
        }));

  const created: Quotation[] = [];
  const seenEnquiry = new Set<string>();

  for (const prior of enquiries) {
    if (seenEnquiry.has(prior.enquiryId)) continue;
    seenEnquiry.add(prior.enquiryId);
    if (prior.id && !prior.id.startsWith("virtual-")) {
      supersedeQuotationInOverlay(prior);
    }
    const quote: Quotation = {
      id: `quo-rescue-${Date.now()}-${seenEnquiry.size}`,
      partId: opts.partId,
      enquiryId: prior.enquiryId,
      quoteNumber: nextRescueQuoteNumber(part.code),
      unitPrice: price,
      currency: "INR",
      quantity: prior.quantity || 1,
      leadTimeDays: prior.leadTimeDays || 21,
      validUntil: new Date(Date.now() + 30 * 86400000)
        .toISOString()
        .slice(0, 10),
      terms: prior.terms || "Net 30 · Ex-works",
      notes: `Rescue quote priced to honour ${opts.targetGrossMarginPct.toFixed(1)}% gross margin. Live part cost ${formatInr(opts.costBasis)}.`,
      status: "Draft",
      costBasis: opts.costBasis,
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: "You",
      customFields: [
        {
          id: "rescue-goal",
          label: "Target margin",
          value: `${opts.targetGrossMarginPct.toFixed(1)}%`,
        },
      ],
    };
    addQuotation(quote);
    created.push(quote);
  }
  return created;
}

export function RescueQuoteModal({
  open,
  onClose,
  partId,
  costBasis,
  currentUnitPrice,
  targetGrossMarginPct,
  onCreated,
  mode = "single",
}: {
  open: boolean;
  onClose: () => void;
  partId: string;
  costBasis: number;
  currentUnitPrice: number;
  targetGrossMarginPct: number;
  onCreated?: (quotes: Quotation[]) => void;
  /** single = one enquiry; all = every active quote's customer/enquiry */
  mode?: "single" | "all";
}) {
  const router = useRouter();
  const part = getPart(partId);
  const enquiries = getEnquiriesForPart(partId);
  const existing = getQuotationsForPart(partId).filter(
    (q) => q.status === "Sent" || q.status === "Draft",
  );

  const suggested = useMemo(
    () => priceForTargetGrossMargin(costBasis, targetGrossMarginPct),
    [costBasis, targetGrossMarginPct],
  );

  const [enquiryId, setEnquiryId] = useState(
    enquiries[0]?.id ?? existing[0]?.enquiryId ?? "",
  );
  const [unitPrice, setUnitPrice] = useState(String(suggested));
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);

  if (!open || !part) return null;

  const priceNum = Number(unitPrice) || 0;
  const achievedMargin =
    priceNum > 0 ? ((priceNum - costBasis) / priceNum) * 100 : null;
  const meetsGoal =
    achievedMargin != null && achievedMargin >= targetGrossMarginPct - 0.05;
  const deltaVsOld = priceNum - currentUnitPrice;
  const activeCount = Math.max(
    existing.length,
    new Set(existing.map((q) => q.enquiryId)).size,
  );

  return (
    <ModalShell
      title={
        mode === "all"
          ? "New quotes for all active customers"
          : "New quote at margin goal"
      }
      onClose={onClose}
    >
      <form
        noValidate
        className="space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setAttempted(true);
          if (!meetsGoal || busy) return;
          if (mode === "single" && !enquiryId) return;
          if (!(Number(unitPrice) > 0)) return;
          setBusy(true);

          let created: Quotation[] = [];
          if (mode === "all") {
            created = createRescueQuotesForPart({
              partId,
              costBasis,
              targetGrossMarginPct,
              unitPrice: priceNum,
            });
          } else {
            const prior = existing.find((q) => q.enquiryId === enquiryId);
            if (prior) supersedeQuotationInOverlay(prior);
            const quote: Quotation = {
              id: `quo-rescue-${Date.now()}`,
              partId,
              enquiryId,
              quoteNumber: nextRescueQuoteNumber(part.code),
              unitPrice: priceNum,
              currency: "INR",
              quantity: prior?.quantity ?? 1,
              leadTimeDays: prior?.leadTimeDays ?? 21,
              validUntil: new Date(Date.now() + 30 * 86400000)
                .toISOString()
                .slice(0, 10),
              terms: prior?.terms ?? "Net 30 · Ex-works",
              notes: `Rescue quote priced to honour ${targetGrossMarginPct.toFixed(1)}% gross margin. Live part cost ${formatInr(costBasis)}. Prior unit ${formatInr(currentUnitPrice)}.`,
              status: "Draft",
              costBasis,
              createdAt: new Date().toISOString().slice(0, 10),
              createdBy: "You",
              customFields: [
                {
                  id: "rescue-goal",
                  label: "Target margin",
                  value: `${targetGrossMarginPct.toFixed(1)}%`,
                },
              ],
            };
            addQuotation(quote);
            created = [quote];
          }

          markStory("urgent_act");
          markStory("create_quote");
          onCreated?.(created);
          onClose();
          if (created[0]) {
            router.push(`/parts/${partId}/quotations/${created[0].id}`);
          }
          router.refresh();
        }}
      >
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-body-sm text-on-surface-variant">
          Live part cost{" "}
          <span className="font-mono tabular-nums text-on-surface">
            {formatInr(costBasis)}
          </span>
          {" · "}
          Goal{" "}
          <span className="font-mono tabular-nums text-on-surface">
            {targetGrossMarginPct.toFixed(1)}%
          </span>
          {" · "}
          Suggested{" "}
          <span className="font-mono font-semibold tabular-nums text-primary">
            {formatInr(suggested)}
          </span>
          {mode === "all" ? (
            <span className="mt-1 block">
              Will create drafts for {Math.max(activeCount, 1)} active
              quote/enquiry line(s) on this part.
            </span>
          ) : null}
        </div>

        {mode === "single" ? (
          <FormSelect
            label="Customer enquiry"
            value={enquiryId}
            onChange={setEnquiryId}
            required
            attempted={attempted}
          >
            {enquiries.length === 0 ? (
              <option value="" disabled>
                No enquiry — open Commercial first
              </option>
            ) : (
              enquiries.map((enq) => (
                <option key={enq.id} value={enq.id}>
                  {enq.reference} · {enq.customer} · {enq.status}
                </option>
              ))
            )}
          </FormSelect>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
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
          <div className="rounded-sm border border-outline-variant bg-surface-low px-3 py-2">
            <p className="label-caps text-on-surface-variant">
              Resulting margin
            </p>
            <p
              className={`mt-1 font-mono text-headline-sm tabular-nums ${
                meetsGoal ? "text-primary" : "text-error"
              }`}
            >
              {achievedMargin == null ? "—" : `${achievedMargin.toFixed(1)}%`}
            </p>
            <p className="mt-0.5 text-[11px] text-on-surface-variant">
              {deltaVsOld >= 0 ? "+" : ""}
              {formatInr(deltaVsOld)} vs current
            </p>
          </div>
        </div>

        {!meetsGoal ? (
          <p className="text-body-sm text-error">
            Raise unit price to at least {formatInr(suggested)} to hit the{" "}
            {targetGrossMarginPct.toFixed(1)}% goal.
          </p>
        ) : (
          <p className="text-body-sm text-on-surface-variant">
            Creates <strong>Draft</strong> quote(s). Prior open quotes on those
            enquiries are marked superseded locally.
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <button
            type="button"
            className="press cursor-pointer rounded-sm border border-outline-variant px-3 py-2 text-body-sm text-on-surface hover:bg-surface-low"
            onClick={() => setUnitPrice(String(suggested))}
          >
            Use suggested
          </button>
          <Button
            type="submit"
            disabled={
              !meetsGoal ||
              busy ||
              (mode === "single" && !enquiryId)
            }
          >
            <Plus className="h-4 w-4" />
            {mode === "all" ? "Create all drafts" : "Create draft quote"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
