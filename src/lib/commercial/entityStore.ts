import type {
  Customer,
  CustomerResponse,
  Part,
  Quotation,
  Enquiry,
} from "@/lib/types";

const MODE_KEY = "partiq-commercial-mode";
const CUST_KEY = "partiq-customers-overlay-v1";
const PART_KEY = "partiq-parts-overlay-v1";
const ENQ_KEY = "partiq-enquiries-overlay-v1";
const QUOTE_KEY = "partiq-quotes-overlay-v1";
const RESP_KEY = "partiq-responses-overlay-v1";
const EXCEPTION_KEY = "partiq-margin-exceptions-v1";
const STORY_KEY = "partiq-story-progress-v1";

export type CommercialMode = "seed" | "story";

export type StoryStepId =
  | "setup_plant"
  | "add_machine"
  | "create_customer"
  | "create_part"
  | "process_times"
  | "attach_gcode"
  | "create_quote"
  | "impact_change"
  | "urgent_act";

export type StoryProgress = {
  startedAt: string | null;
  completed: Partial<Record<StoryStepId, boolean>>;
  dismissed: boolean;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getCommercialMode(): CommercialMode {
  const mode = readJson<CommercialMode | null>(MODE_KEY, null);
  if (mode === "story") return "story";
  return "seed";
}

export function setCommercialMode(mode: CommercialMode) {
  writeJson(MODE_KEY, mode);
}

export function readCustomerOverlay(): Customer[] {
  return readJson(CUST_KEY, [] as Customer[]);
}
export function readPartOverlay(): Part[] {
  return readJson(PART_KEY, [] as Part[]);
}
export function readEnquiryOverlay(): Enquiry[] {
  return readJson(ENQ_KEY, [] as Enquiry[]);
}
export function readQuoteOverlay(): Quotation[] {
  return readJson(QUOTE_KEY, [] as Quotation[]);
}

export function readResponseOverlay(): CustomerResponse[] {
  return readJson(RESP_KEY, [] as CustomerResponse[]);
}

export function upsertCustomer(customer: Customer) {
  const list = readCustomerOverlay().filter((c) => c.id !== customer.id);
  list.push(customer);
  writeJson(CUST_KEY, list);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("partiq-story-refresh"));
  }
  return customer;
}

export function upsertPart(part: Part) {
  const list = readPartOverlay().filter((p) => p.id !== part.id);
  list.push(part);
  writeJson(PART_KEY, list);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("partiq-story-refresh"));
  }
  return part;
}

export function upsertEnquiry(enquiry: Enquiry) {
  const list = readEnquiryOverlay().filter((e) => e.id !== enquiry.id);
  list.push(enquiry);
  writeJson(ENQ_KEY, list);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("partiq-story-refresh"));
  }
  return enquiry;
}

export function addQuotation(quote: Quotation): Quotation {
  const list = readQuoteOverlay().filter((q) => q.id !== quote.id);
  list.push(quote);
  writeJson(QUOTE_KEY, list);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("partiq-story-refresh"));
  }
  return quote;
}

export function upsertQuotation(quote: Quotation): Quotation {
  return addQuotation(quote);
}

export function addCustomerResponse(
  response: CustomerResponse,
): CustomerResponse {
  const list = readResponseOverlay().filter((r) => r.id !== response.id);
  list.push(response);
  writeJson(RESP_KEY, list);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("partiq-story-refresh"));
  }
  return response;
}

export function upsertCustomerResponse(
  response: CustomerResponse,
): CustomerResponse {
  return addCustomerResponse(response);
}

export function supersedeQuotationInOverlay(quote: Quotation): Quotation {
  const next: Quotation = { ...quote, status: "Superseded" };
  return addQuotation(next);
}

export type MarginException = {
  quotationId: string;
  partId: string;
  acceptedAt: string;
  goalPct: number;
  marginPct: number;
};

export function readMarginExceptions(): MarginException[] {
  return readJson(EXCEPTION_KEY, [] as MarginException[]);
}

export function acceptBelowGoal(exception: MarginException) {
  const list = readMarginExceptions().filter(
    (e) => e.quotationId !== exception.quotationId,
  );
  list.push(exception);
  writeJson(EXCEPTION_KEY, list);
}

export function isMarginExcepted(quotationId: string): boolean {
  return readMarginExceptions().some((e) => e.quotationId === quotationId);
}

export function readStoryProgress(): StoryProgress {
  return readJson(STORY_KEY, {
    startedAt: null,
    completed: {},
    dismissed: false,
  } satisfies StoryProgress);
}

export function writeStoryProgress(progress: StoryProgress) {
  writeJson(STORY_KEY, progress);
}

export function completeStoryStep(id: StoryStepId) {
  const prev = readStoryProgress();
  writeStoryProgress({
    ...prev,
    startedAt: prev.startedAt ?? new Date().toISOString(),
    completed: { ...prev.completed, [id]: true },
  });
}

export function clearCommercialOverlays() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(CUST_KEY);
  window.localStorage.removeItem(PART_KEY);
  window.localStorage.removeItem(ENQ_KEY);
  window.localStorage.removeItem(QUOTE_KEY);
  window.localStorage.removeItem(RESP_KEY);
  window.localStorage.removeItem(EXCEPTION_KEY);
}

export function startGuidedStorySession() {
  setCommercialMode("story");
  clearCommercialOverlays();
  writeStoryProgress({
    startedAt: new Date().toISOString(),
    completed: {},
    dismissed: false,
  });
}

export function enableClassicSeedDemo() {
  setCommercialMode("seed");
  writeStoryProgress({
    startedAt: null,
    completed: {},
    dismissed: true,
  });
}

/**
 * Unit price that yields target gross margin: margin = (P-C)/P ⇒ P = C/(1-m).
 */
export function priceForTargetGrossMargin(
  costBasis: number,
  targetGrossMarginPct: number,
): number {
  const m = Math.min(Math.max(targetGrossMarginPct, 0), 95) / 100;
  if (costBasis <= 0) return 0;
  if (m >= 1) return costBasis;
  return Math.ceil((costBasis / (1 - m)) * 100) / 100;
}

export function nextRescueQuoteNumber(partCode: string): string {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `Q-${stamp}-${partCode}-${suffix}`;
}

export const STORY_STEPS: {
  id: StoryStepId;
  title: string;
  body: string;
  href: string;
}[] = [
  {
    id: "setup_plant",
    title: "Set up your plant",
    body: "Name, city, power rate, machines, labour, overhead — and your margin goal.",
    href: "/setup",
  },
  {
    id: "add_machine",
    title: "Confirm or add a machine",
    body: "You can add machines anytime from Factory or Impact → Machines.",
    href: "/factory",
  },
  {
    id: "create_customer",
    title: "Create a customer",
    body: "Add the buyer you’ll quote.",
    href: "/customers",
  },
  {
    id: "create_part",
    title: "Create a part",
    body: "Link the part to that customer.",
    href: "/parts",
  },
  {
    id: "process_times",
    title: "Set process times",
    body: "Enter estimated and actual minutes on a process step.",
    href: "/parts",
  },
  {
    id: "attach_gcode",
    title: "Attach G-code",
    body: "Upload or name a G-code file on the process.",
    href: "/parts",
  },
  {
    id: "create_quote",
    title: "Send a quote",
    body: "Price the part for the customer (Commercial → New quotation).",
    href: "/parts",
  },
  {
    id: "impact_change",
    title: "Change a plant parameter",
    body: "In Impact, edit with the same depth as setup — then Adopt.",
    href: "/master-data",
  },
  {
    id: "urgent_act",
    title: "Act on flagged parts",
    body: "Accept below-goal margin or raise new quotes for every active quote on the part.",
    href: "/urgent",
  },
];
