import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCustomerResponse,
  getPart,
  getQuotation,
} from "@/lib/data";
import { formatInr } from "@/lib/costing";
import {
  Breadcrumbs,
  Button,
  Panel,
  StatusChip,
} from "@/components/ui/Primitives";
import { CustomFieldsReadonly } from "@/components/ui/CustomFieldsReadonly";

export default async function ResponseDetailPage({
  params,
}: {
  params: Promise<{ partId: string; responseId: string }>;
}) {
  const { partId, responseId } = await params;
  const part = getPart(partId);
  const response = getCustomerResponse(responseId);
  if (!part || !response || response.partId !== partId) notFound();

  const quotation = getQuotation(response.quotationId);

  return (
    <div className="p-8">
      <Breadcrumbs
        items={[
          { label: "Parts", href: "/parts" },
          { label: part.code, href: `/parts/${part.id}` },
          { label: "Commercial", href: `/parts/${part.id}/commercial` },
          { label: `Response · ${response.respondedAt}` },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-headline-lg text-on-surface">
              Customer response
            </h2>
            <StatusChip status={response.outcome} />
          </div>
          <p className="text-body-md text-on-surface-variant">
            For {part.code}
            {quotation ? (
              <>
                {" · "}
                <Link
                  href={`/parts/${part.id}/quotations/${quotation.id}`}
                  className="font-mono text-primary hover:underline"
                >
                  {quotation.quoteNumber}
                </Link>
              </>
            ) : null}
            {" · "}
            Logged by {response.createdBy}
          </p>
        </div>
        <Link href={`/parts/${part.id}/commercial`}>
          <Button variant="ghost">Back to hub</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Response details">
          <dl className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <Detail label="Outcome" value={response.outcome} />
            <Detail label="Responded at" value={response.respondedAt} mono />
            <Detail
              label="Revised qty"
              value={
                response.revisedQty != null ? String(response.revisedQty) : "—"
              }
              mono
            />
            <Detail
              label="Counter price"
              value={
                response.counterPrice != null
                  ? formatInr(response.counterPrice)
                  : "—"
              }
              mono
            />
            <div className="sm:col-span-2">
              <dt className="label-caps mb-1 text-on-surface-variant">Notes</dt>
              <dd className="text-body-sm text-on-surface">
                {response.notes || "—"}
              </dd>
            </div>
          </dl>
        </Panel>

        <CustomFieldsReadonly fields={response.customFields} />
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
