"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import {
  getEnquiriesForCustomer,
  getPart,
  getPartsForCustomer,
} from "@/lib/data";
import {
  Breadcrumbs,
  Button,
  Panel,
  StatusChip,
} from "@/components/ui/Primitives";
import { CustomFieldsReadonly } from "@/components/ui/CustomFieldsReadonly";
import {
  CreateEnquiryModal,
  LinkPartToCustomerModal,
} from "@/components/ui/CommercialModals";
import { CreatePartModal } from "@/components/ui/Modals";
import {
  EntityLoading,
  EntityMissing,
  useCustomer,
  useOverlayReady,
} from "@/lib/commercial/useClientEntity";

export default function CustomerDetailPage() {
  const params = useParams<{ customerId: string }>();
  const ready = useOverlayReady(params.customerId);
  const customer = useCustomer(params.customerId);
  const [tick, setTick] = useState(0);
  const [linkPartOpen, setLinkPartOpen] = useState(false);
  const [createPartOpen, setCreatePartOpen] = useState(false);
  const [rfqOpen, setRfqOpen] = useState(false);

  const linkedParts = useMemo(() => {
    void tick;
    if (!customer) return [];
    return getPartsForCustomer(customer.id);
  }, [customer, tick]);

  const linkedEnquiries = useMemo(() => {
    void tick;
    if (!customer) return [];
    return getEnquiriesForCustomer(customer.id);
  }, [customer, tick]);

  if (!ready) return <EntityLoading />;
  if (!customer) {
    return (
      <EntityMissing
        label="Customer not found"
        href="/customers"
        linkLabel="Back to customers"
      />
    );
  }

  const bump = () => setTick((t) => t + 1);

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
          <p className="mt-1 max-w-xl text-[12px] text-on-surface-variant">
            Link a part as primary buyer, or open an RFQ on a specific part —
            every RFQ is part-dependent.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setLinkPartOpen(true)}>
            <Plus className="h-4 w-4" />
            Link part
          </Button>
          <Button onClick={() => setRfqOpen(true)}>
            <Plus className="h-4 w-4" />
            New RFQ
          </Button>
          <Link href="/customers">
            <Button variant="ghost">Back to list</Button>
          </Link>
        </div>
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
              <div className="flex items-center gap-3">
                <span className="label-caps text-on-surface-variant">
                  {linkedParts.length}
                </span>
                <button
                  type="button"
                  onClick={() => setLinkPartOpen(true)}
                  className="text-body-sm font-medium text-primary hover:underline"
                >
                  + Link
                </button>
              </div>
            }
          >
            {linkedParts.length === 0 ? (
              <div className="space-y-3 p-4">
                <p className="text-body-sm text-on-surface-variant">
                  No parts yet. Link an existing part as primary, or create an
                  RFQ on a part.
                </p>
                <Button variant="secondary" onClick={() => setLinkPartOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Link part
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {linkedParts.map((p) => {
                  const isPrimary = p.customerId === customer.id;
                  const rfqCount = linkedEnquiries.filter(
                    (e) => e.partId === p.id,
                  ).length;
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/parts/${p.id}`}
                        className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-surface-low/60"
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-code-md text-primary">
                            {p.code}
                          </span>
                          <p className="truncate text-[11px] text-on-surface-variant">
                            {isPrimary ? "Primary" : "Via RFQ"}
                            {rfqCount > 0 ? ` · ${rfqCount} RFQ` : ""}
                          </p>
                        </div>
                        <StatusChip status={p.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel
            title="Linked RFQs"
            action={
              <div className="flex items-center gap-3">
                <span className="label-caps text-on-surface-variant">
                  {linkedEnquiries.length}
                </span>
                <button
                  type="button"
                  onClick={() => setRfqOpen(true)}
                  className="text-body-sm font-medium text-primary hover:underline"
                >
                  + RFQ
                </button>
              </div>
            }
          >
            {linkedEnquiries.length === 0 ? (
              <div className="space-y-3 p-4">
                <p className="text-body-sm text-on-surface-variant">
                  No enquiries yet. Each RFQ must pick a part.
                </p>
                <Button variant="secondary" onClick={() => setRfqOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New RFQ
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {linkedEnquiries.map((e) => {
                  const part = getPart(e.partId);
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/parts/${e.partId}/enquiries/${e.id}`}
                        className="block px-4 py-3 hover:bg-surface-low/60"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-code-md text-primary">
                            {e.reference}
                          </span>
                          <StatusChip status={e.status} />
                        </div>
                        <p className="mt-1 text-[11px] text-on-surface-variant">
                          Part{" "}
                          <span className="font-mono text-on-surface">
                            {part?.code ?? e.partId}
                          </span>
                          {part ? ` · ${part.name}` : ""}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {linkPartOpen ? (
        <LinkPartToCustomerModal
          open
          customerId={customer.id}
          onClose={() => {
            setLinkPartOpen(false);
            bump();
          }}
          onCreateNewPart={() => {
            setLinkPartOpen(false);
            setCreatePartOpen(true);
          }}
        />
      ) : null}
      {createPartOpen ? (
        <CreatePartModal
          open
          defaultCustomerId={customer.id}
          lockCustomer
          onClose={() => {
            setCreatePartOpen(false);
            bump();
          }}
        />
      ) : null}
      {rfqOpen ? (
        <CreateEnquiryModal
          open
          defaultCustomerId={customer.id}
          lockCustomer
          onClose={() => {
            setRfqOpen(false);
            bump();
          }}
        />
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
        {value || "—"}
      </dd>
    </div>
  );
}
