"use client";

import { createElement, useEffect, useState, type ReactNode } from "react";
import {
  getCustomer,
  getCustomerResponse,
  getEnquiry,
  getPart,
  getQuotation,
} from "@/lib/data";
import type {
  Customer,
  CustomerResponse,
  Enquiry,
  Part,
  Quotation,
} from "@/lib/types";

function useOverlayEntity<T>(
  id: string | undefined,
  read: (id: string) => T | undefined,
): T | undefined {
  const [entity, setEntity] = useState<T | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setEntity(id ? read(id) : undefined);
      setReady(true);
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("partiq-story-refresh", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("partiq-story-refresh", refresh);
    };
  }, [id, read]);

  if (!ready) return undefined;
  return entity;
}

const readPart = (id: string) => getPart(id);
const readCustomer = (id: string) => getCustomer(id);
const readEnquiry = (id: string) => getEnquiry(id);
const readQuotation = (id: string) => getQuotation(id);
const readResponse = (id: string) => getCustomerResponse(id);

export function usePart(partId: string | undefined): Part | undefined {
  return useOverlayEntity(partId, readPart);
}

export function useCustomer(
  customerId: string | undefined,
): Customer | undefined {
  return useOverlayEntity(customerId, readCustomer);
}

export function useEnquiry(
  enquiryId: string | undefined,
): Enquiry | undefined {
  return useOverlayEntity(enquiryId, readEnquiry);
}

export function useQuotation(
  quotationId: string | undefined,
): Quotation | undefined {
  return useOverlayEntity(quotationId, readQuotation);
}

export function useCustomerResponse(
  responseId: string | undefined,
): CustomerResponse | undefined {
  return useOverlayEntity(responseId, readResponse);
}

/** True after first client hydrate attempt for an overlay id. */
export function useOverlayReady(id: string | undefined): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, [id]);
  return ready;
}

export function EntityMissing({
  label = "Not found",
  href = "/parts",
  linkLabel = "Back to parts",
}: {
  label?: string;
  href?: string;
  linkLabel?: string;
}): ReactNode {
  return createElement(
    "div",
    { className: "p-8" },
    createElement("p", { className: "text-headline-sm text-on-surface" }, label),
    createElement(
      "p",
      { className: "mt-1 text-body-sm text-on-surface-variant" },
      "This record may only exist in this browser's guided-story data.",
    ),
    createElement(
      "a",
      {
        href,
        className:
          "mt-4 inline-block text-body-sm font-medium text-primary hover:underline",
      },
      linkLabel,
    ),
  );
}

export function EntityLoading(): ReactNode {
  return createElement(
    "div",
    { className: "p-8 text-body-sm text-on-surface-variant" },
    "Loading…",
  );
}
