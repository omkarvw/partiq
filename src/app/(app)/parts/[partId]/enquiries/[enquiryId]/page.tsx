import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEnquiry,
  getPart,
  getQuotationsForEnquiry,
} from "@/lib/data";
import { formatInr } from "@/lib/costing";
import {
  Breadcrumbs,
  Button,
  Panel,
  StatusChip,
} from "@/components/ui/Primitives";
import { CustomFieldsReadonly } from "@/components/ui/CustomFieldsReadonly";
import { EnquiryActions } from "./enquiry-actions";

export default async function EnquiryDetailPage({
  params,
}: {
  params: Promise<{ partId: string; enquiryId: string }>;
}) {
  const { partId, enquiryId } = await params;
  const part = getPart(partId);
  const enquiry = getEnquiry(enquiryId);
  if (!part || !enquiry || enquiry.partId !== partId) notFound();

  const quotes = getQuotationsForEnquiry(enquiry.id);

  return (
    <div className="p-8">
      <Breadcrumbs
        items={[
          { label: "Parts", href: "/parts" },
          { label: part.code, href: `/parts/${part.id}` },
          { label: "Commercial", href: `/parts/${part.id}/commercial` },
          { label: enquiry.reference },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-headline-lg text-on-surface">{enquiry.reference}</h2>
            <StatusChip status={enquiry.status} />
          </div>
          <p className="text-body-md text-on-surface-variant">
            Enquiry / RFQ for {part.code} · Logged {enquiry.createdAt} by{" "}
            {enquiry.createdBy}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/parts/${part.id}/commercial`}>
            <Button variant="ghost">Back to hub</Button>
          </Link>
          <EnquiryActions
            enquiryId={enquiry.id}
            enquiryLabel={`${enquiry.reference} · ${enquiry.customer}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Enquiry details">
            <dl className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div>
                <dt className="label-caps mb-1 text-on-surface-variant">Customer</dt>
                <dd className="text-body-sm text-on-surface">
                  <Link
                    href={`/customers/${enquiry.customerId}`}
                    className="text-primary hover:underline"
                  >
                    {enquiry.customer}
                  </Link>
                </dd>
              </div>
              <Detail label="Quantity" value={String(enquiry.quantity)} mono />
              <Detail label="Needed by" value={enquiry.neededBy} mono />
              <Detail label="Quote by" value={enquiry.quoteBy} mono />
              <div className="sm:col-span-2">
                <dt className="label-caps mb-1 text-on-surface-variant">Notes</dt>
                <dd className="text-body-sm text-on-surface">{enquiry.notes || "—"}</dd>
              </div>
            </dl>
          </Panel>

          <CustomFieldsReadonly fields={enquiry.customFields} />
        </div>

        <Panel
          title="Linked quotations"
          action={
            <span className="label-caps text-on-surface-variant">
              {quotes.length}
            </span>
          }
        >
          {quotes.length === 0 ? (
            <p className="p-4 text-body-sm text-on-surface-variant">
              No quotations linked yet.
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant/50">
              {quotes.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/parts/${part.id}/quotations/${q.id}`}
                    className="block px-4 py-3 hover:bg-surface-low/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-code-md text-primary">
                        {q.quoteNumber}
                      </span>
                      <StatusChip status={q.status} />
                    </div>
                    <p className="mt-1 font-mono text-code-sm text-on-surface">
                      {formatInr(q.unitPrice)} · qty {q.quantity}
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
