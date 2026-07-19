"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import {
  getCommercialSummaryForPart,
  getPart,
} from "@/lib/data";
import { formatInr } from "@/lib/costing";
import {
  Breadcrumbs,
  Button,
  Panel,
  StatusChip,
} from "@/components/ui/Primitives";
import {
  CreateEnquiryModal,
  CreateQuotationModal,
  CreateResponseModal,
} from "@/components/ui/CommercialModals";

type Tab = "enquiries" | "quotations" | "responses";

export default function CommercialHubPage() {
  const params = useParams<{ partId: string }>();
  const part = getPart(params.partId);
  const [tab, setTab] = useState<Tab>("enquiries");
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [responseOpen, setResponseOpen] = useState(false);

  const summary = useMemo(
    () => (part ? getCommercialSummaryForPart(part.id) : null),
    [part],
  );

  const quotesById = useMemo(() => {
    if (!summary) return new Map<string, { quoteNumber: string }>();
    return new Map(summary.quotations.map((q) => [q.id, q]));
  }, [summary]);

  if (!part || !summary) {
    return <div className="p-8 text-body-md">Part not found.</div>;
  }

  const enquiryOptions = summary.enquiries.map((e) => ({
    id: e.id,
    label: `${e.reference} · ${e.customer} · qty ${e.quantity}`,
  }));
  const quotationOptions = summary.quotations.map((q) => ({
    id: q.id,
    label: `${q.quoteNumber} · ${formatInr(q.unitPrice)}`,
  }));

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "enquiries", label: "Enquiries (RFQ)", count: summary.enquiries.length },
    { id: "quotations", label: "Quotations", count: summary.quotations.length },
    { id: "responses", label: "Customer responses", count: summary.responses.length },
  ];

  return (
    <div className="p-8">
      <Breadcrumbs
        items={[
          { label: "Parts", href: "/parts" },
          { label: part.code, href: `/parts/${part.id}` },
          { label: "Commercial" },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-headline-lg text-on-surface">Commercial</h2>
          <p className="mt-1 max-w-2xl text-body-md text-on-surface-variant">
            Enquiries, quotations, and customer responses for{" "}
            <span className="font-mono text-on-surface">{part.code}</span>
            {" · "}
            {part.customer}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === "enquiries" && (
            <Button onClick={() => setEnquiryOpen(true)}>
              <Plus className="h-4 w-4" />
              New Enquiry
            </Button>
          )}
          {tab === "quotations" && (
            <Button
              onClick={() => setQuoteOpen(true)}
              disabled={enquiryOptions.length === 0}
            >
              <Plus className="h-4 w-4" />
              New Quotation
            </Button>
          )}
          {tab === "responses" && (
            <Button
              onClick={() => setResponseOpen(true)}
              disabled={quotationOptions.length === 0}
            >
              <Plus className="h-4 w-4" />
              Log Response
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-outline-variant">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`cursor-pointer border-b-2 px-4 py-2 text-body-sm font-medium transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t.label}
            <span className="ml-2 font-mono text-code-sm opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "enquiries" && (
        <Panel title="Enquiries / RFQs">
          {summary.enquiries.length === 0 ? (
            <p className="p-6 text-body-sm text-on-surface-variant">
              No enquiries yet. Record a customer RFQ to begin quoting.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-low/50 text-on-surface-variant">
                    <th className="label-caps px-4 py-3 font-medium">Reference</th>
                    <th className="label-caps px-4 py-3 font-medium">Customer</th>
                    <th className="label-caps px-4 py-3 font-medium">Qty</th>
                    <th className="label-caps px-4 py-3 font-medium">Quote by</th>
                    <th className="label-caps px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {summary.enquiries.map((e) => (
                    <tr key={e.id} className="hover:bg-surface-low/40">
                      <td className="px-4 py-3">
                        <Link
                          href={`/parts/${part.id}/enquiries/${e.id}`}
                          className="font-mono text-code-md font-medium text-primary hover:underline"
                        >
                          {e.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface">
                        {e.customer}
                      </td>
                      <td className="px-4 py-3 font-mono text-code-sm">{e.quantity}</td>
                      <td className="px-4 py-3 font-mono text-code-sm text-on-surface-variant">
                        {e.quoteBy}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip status={e.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab === "quotations" && (
        <Panel title="Quotations">
          {summary.quotations.length === 0 ? (
            <p className="p-6 text-body-sm text-on-surface-variant">
              No quotations yet. Create one from an enquiry.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-low/50 text-on-surface-variant">
                    <th className="label-caps px-4 py-3 font-medium">Quote #</th>
                    <th className="label-caps px-4 py-3 font-medium">Unit price</th>
                    <th className="label-caps px-4 py-3 font-medium">Qty</th>
                    <th className="label-caps px-4 py-3 font-medium">Lead time</th>
                    <th className="label-caps px-4 py-3 font-medium">Valid until</th>
                    <th className="label-caps px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {summary.quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-surface-low/40">
                      <td className="px-4 py-3">
                        <Link
                          href={`/parts/${part.id}/quotations/${q.id}`}
                          className="font-mono text-code-md font-medium text-primary hover:underline"
                        >
                          {q.quoteNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-code-sm">
                        {formatInr(q.unitPrice)}
                      </td>
                      <td className="px-4 py-3 font-mono text-code-sm">{q.quantity}</td>
                      <td className="px-4 py-3 font-mono text-code-sm text-on-surface-variant">
                        {q.leadTimeDays}d
                      </td>
                      <td className="px-4 py-3 font-mono text-code-sm text-on-surface-variant">
                        {q.validUntil}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip status={q.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab === "responses" && (
        <Panel title="Customer responses">
          {summary.responses.length === 0 ? (
            <p className="p-6 text-body-sm text-on-surface-variant">
              No customer responses logged yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-low/50 text-on-surface-variant">
                    <th className="label-caps px-4 py-3 font-medium">Date</th>
                    <th className="label-caps px-4 py-3 font-medium">Quotation</th>
                    <th className="label-caps px-4 py-3 font-medium">Outcome</th>
                    <th className="label-caps px-4 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {summary.responses.map((r) => {
                    const quote = quotesById.get(r.quotationId);
                    return (
                      <tr key={r.id} className="hover:bg-surface-low/40">
                        <td className="px-4 py-3 font-mono text-code-sm text-on-surface-variant">
                          {r.respondedAt}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/parts/${part.id}/responses/${r.id}`}
                            className="font-mono text-code-md font-medium text-primary hover:underline"
                          >
                            {quote?.quoteNumber ?? r.quotationId}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip status={r.outcome} />
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-body-sm text-on-surface-variant">
                          {r.notes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {enquiryOpen ? (
        <CreateEnquiryModal
          open
          onClose={() => setEnquiryOpen(false)}
          defaultCustomerId={part.customerId}
        />
      ) : null}
      {quoteOpen ? (
        <CreateQuotationModal
          open
          onClose={() => setQuoteOpen(false)}
          enquiryOptions={enquiryOptions}
        />
      ) : null}
      {responseOpen ? (
        <CreateResponseModal
          open
          onClose={() => setResponseOpen(false)}
          quotationOptions={quotationOptions}
        />
      ) : null}
    </div>
  );
}
