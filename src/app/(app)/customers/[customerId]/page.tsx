import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCustomer,
  getEnquiriesForCustomer,
  getPartsForCustomer,
} from "@/lib/data";
import {
  Breadcrumbs,
  Button,
  Panel,
  StatusChip,
} from "@/components/ui/Primitives";
import { CustomFieldsReadonly } from "@/components/ui/CustomFieldsEditor";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const customer = getCustomer(customerId);
  if (!customer) notFound();

  const linkedParts = getPartsForCustomer(customer.id);
  const linkedEnquiries = getEnquiriesForCustomer(customer.id);

  return (
    <div className="p-8">
      <Breadcrumbs
        items={[
          { label: "Customers", href: "/customers" },
          { label: customer.code },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-headline-lg text-on-surface">{customer.name}</h2>
            <StatusChip status={customer.status} />
          </div>
          <p className="font-mono text-code-md text-on-surface-variant">
            {customer.code} · Added {customer.createdAt}
          </p>
        </div>
        <Link href="/customers">
          <Button variant="ghost">Back to list</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Customer details">
            <dl className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <Detail label="Contact" value={customer.contactName} />
              <Detail label="Email" value={customer.email} mono />
              <Detail label="Phone" value={customer.phone} mono />
              <Detail label="City" value={customer.city} />
              <div className="sm:col-span-2">
                <dt className="label-caps mb-1 text-on-surface-variant">Notes</dt>
                <dd className="text-body-sm text-on-surface">
                  {customer.notes || "—"}
                </dd>
              </div>
            </dl>
          </Panel>

          <CustomFieldsReadonly fields={customer.customFields} />
        </div>

        <div className="space-y-4">
          <Panel
            title="Linked parts"
            action={
              <span className="label-caps text-on-surface-variant">
                {linkedParts.length}
              </span>
            }
          >
            {linkedParts.length === 0 ? (
              <p className="p-4 text-body-sm text-on-surface-variant">No parts yet.</p>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {linkedParts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/parts/${p.id}`}
                      className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-surface-low/60"
                    >
                      <span className="font-mono text-code-md text-primary">
                        {p.code}
                      </span>
                      <StatusChip status={p.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Linked RFQs"
            action={
              <span className="label-caps text-on-surface-variant">
                {linkedEnquiries.length}
              </span>
            }
          >
            {linkedEnquiries.length === 0 ? (
              <p className="p-4 text-body-sm text-on-surface-variant">No enquiries yet.</p>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {linkedEnquiries.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/parts/${e.partId}/enquiries/${e.id}`}
                      className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-surface-low/60"
                    >
                      <span className="font-mono text-code-md text-primary">
                        {e.reference}
                      </span>
                      <StatusChip status={e.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
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
        {value || "—"}
      </dd>
    </div>
  );
}
