import type { Quotation } from "@/lib/types";
import {
  addQuotation as addInEntityStore,
  readQuoteOverlay,
  supersedeQuotationInOverlay as supersedeInEntity,
  priceForTargetGrossMargin,
  nextRescueQuoteNumber,
} from "@/lib/commercial/entityStore";

/** @deprecated Prefer entityStore — kept for older imports. */
export function readQuoteOverlayCompat() {
  return readQuoteOverlay();
}

export function addQuotation(quote: Quotation): Quotation {
  return addInEntityStore(quote);
}

export function supersedeQuotationInOverlay(quote: Quotation): Quotation {
  return supersedeInEntity(quote);
}

export { priceForTargetGrossMargin, nextRescueQuoteNumber, readQuoteOverlay };
