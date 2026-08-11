"use client";

import { useRouter } from "next/navigation";
import {
  getPart,
  getQuotation,
  getCustomer,
} from "@/lib/data";
import {
  upsertCustomer,
  upsertPart,
  upsertQuotation,
} from "@/lib/commercial/entityStore";
import type { CustomerStatus, PartStatus, QuotationStatus } from "@/lib/types";

function ToggleButton({
  active,
  onToggle,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: {
  active: boolean;
  onToggle: () => void;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="press cursor-pointer rounded-sm border border-outline-variant px-2.5 py-1 text-[11px] font-medium text-on-surface-variant hover:bg-surface-low"
      title={
        active
          ? `Mark ${inactiveLabel.toLowerCase()}`
          : `Mark ${activeLabel.toLowerCase()}`
      }
    >
      {active ? `Set ${inactiveLabel}` : `Set ${activeLabel}`}
    </button>
  );
}

export function PartStatusToggle({ partId }: { partId: string }) {
  const router = useRouter();
  const part = getPart(partId);
  if (!part) return null;
  const active = part.status !== "Inactive";

  return (
    <ToggleButton
      active={active}
      onToggle={() => {
        const nextStatus: PartStatus = active ? "Inactive" : "Quoting";
        upsertPart({ ...part, status: nextStatus });
        router.refresh();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("partiq-story-refresh"));
        }
      }}
    />
  );
}

export function QuotationStatusToggle({
  quotationId,
}: {
  quotationId: string;
}) {
  const router = useRouter();
  const quote = getQuotation(quotationId);
  if (!quote) return null;
  if (quote.status === "Superseded") return null;
  const active = quote.status !== "Inactive";

  return (
    <ToggleButton
      active={active}
      onToggle={() => {
        const nextStatus: QuotationStatus = active ? "Inactive" : "Draft";
        upsertQuotation({ ...quote, status: nextStatus });
        router.refresh();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("partiq-story-refresh"));
        }
      }}
    />
  );
}

export function CustomerStatusToggle({
  customerId,
}: {
  customerId: string;
}) {
  const router = useRouter();
  const customer = getCustomer(customerId);
  if (!customer) return null;
  const active = customer.status === "Active";

  return (
    <ToggleButton
      active={active}
      onToggle={() => {
        const nextStatus: CustomerStatus = active ? "Inactive" : "Active";
        upsertCustomer({ ...customer, status: nextStatus });
        router.refresh();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("partiq-story-refresh"));
        }
      }}
    />
  );
}
