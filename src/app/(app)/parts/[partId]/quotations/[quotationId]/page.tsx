"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getEnquiry,
  getResponsesForQuotation,
} from "@/lib/data";
import { formatInr } from "@/lib/costing";
import {
  Breadcrumbs,
  Button,
  Panel,
  StatusChip,
} from "@/components/ui/Primitives";
import { CustomFieldsReadonly } from "@/components/ui/CustomFieldsReadonly";
import { QuotationActions } from "./quotation-actions";
import { QuotationLiveEconomics } from "@/components/demo/QuotationLiveEconomics";
import {
  EntityLoading,
  EntityMissing,
  useOverlayReady,
  usePart,
  useQuotation,
} from "@/lib/commercial/useClientEntity";

export default function QuotationDetailPage() {
  const params = useParams<{ partId: string; quotationId: string }>();
  const ready = useOverlayReady(params.quotationId);
  const part = usePart(params.partId);
  const quotation = useQuotation(params.quotationId);
  if (!ready) return <EntityLoading />;
  if (!part || !quotation || quotation.partId !== params.partId) {
    return <EntityMissing label="Quotation not found" />;
  }

  const enquiry = getEnquiry(quotation.enquiryId);
  const responses = getResponsesForQuotation(quotation.id);
  const lineTotal = quotation.unitPrice * quotation.quantity;
  const marginHint =
    quotation.costBasis != null && quotation.costBasis > 0
      ? ((quotation.unitPrice - quotation.costBasis) / quotation.costBasis) * 100
      : null;

  return (
    <div className="p-8">
      <Breadcrumbs
        items={[
          { label: "Parts", href: "/parts" },
          { label: part.code, href: `/parts/${part.id}` },
          { label: "Commercial", href: `/parts/${part.id}/commercial` },
          { label: quotation.quoteNumber },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-headline-lg text-on-surface">
              {quotation.quoteNumber}
            </h2>
            <StatusChip status={quotation.status} />
          </div>
          <p className="text-body-md text-on-surface-variant">
            Quotation for {part.code}
            {enquiry ? (
              <>
                {" · "}
                <Link
                  href={`/parts/${part.id}/enquiries/${enquiry.id}`}
                  className="font-mono text-primary hover:underline"
                >
                  {enquiry.reference}
                </Link>
              </>
            ) : null}
            {" · "}
            {quotation.createdAt} by {quotation.createdBy}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/parts/${part.id}/commercial`}>
            <Button variant="ghost">Back to hub</Button>
          </Link>
          <div className="flex flex-wrap gap-2">
            <QuotationActions
              quotationId={quotation.id}
              quotationLabel={`${quotation.quoteNumber} · ${formatInr(quotation.unitPrice)}`}
            />
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MiniKpi label="Unit price" value={formatInr(quotation.unitPrice)} />
        <MiniKpi label="Line total" value={formatInr(lineTotal)} />
        <MiniKpi
          label="vs process cost"
          value={
            marginHint === null
              ? "—"
              : `${marginHint >= 0 ? "+" : ""}${marginHint.toFixed(1)}%`
          }
          hint={
            quotation.costBasis != null
              ? `Cost basis ${formatInr(quotation.costBasis)}`
              : undefined
          }
        />
      </div>

      <QuotationLiveEconomics
        quotationId={quotation.id}
        quoteNumber={quotation.quoteNumber}
        partId={part.id}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Quotation details">
            <dl className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <Detail label="Quantity" value={String(quotation.quantity)} mono />
              <Detail
                label="Lead time"
                value={`${quotation.leadTimeDays} days`}
                mono
              />
              <Detail label="Valid until" value={quotation.validUntil} mono />
              <Detail label="Currency" value={quotation.currency} mono />
              <div className="sm:col-span-2">
                <dt className="label-caps mb-1 text-on-surface-variant">Terms</dt>
                <dd className="text-body-sm text-on-surface">
                  {quotation.terms || "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="label-caps mb-1 text-on-surface-variant">Notes</dt>
                <dd className="text-body-sm text-on-surface">
                  {quotation.notes || "—"}
                </dd>
              </div>
            </dl>
          </Panel>

          <CustomFieldsReadonly fields={quotation.customFields} />
        </div>

        <Panel
          title="Customer responses"
          action={
            <span className="label-caps text-on-surface-variant">
              {responses.length}
            </span>
          }
        >
          {responses.length === 0 ? (
            <p className="p-4 text-body-sm text-on-surface-variant">
              No responses logged yet.
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant/50">
              {responses.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/parts/${part.id}/responses/${r.id}`}
                    className="block px-4 py-3 hover:bg-surface-low/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-code-sm text-on-surface-variant">
                        {r.respondedAt}
                      </span>
                      <StatusChip status={r.outcome} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-body-sm text-on-surface">
                      {r.notes}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function MiniKpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded border border-outline-variant bg-surface-lowest p-4">
      <span className="label-caps text-on-surface-variant">{label}</span>
      <p className="mt-2 font-mono text-headline-sm text-on-surface">{value}</p>
      {hint ? (
        <p className="mt-1 text-[11px] text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="label-caps mb-1 text-on-surface-variant">{label}</dt>
      <dd
        className={
          mono
            ? "font-mono text-code-md text-on-surface"
            : "text-body-sm text-on-surface"
        }
      >
        {value}
      </dd>
    </div>
  );
}
