export type PartStatus =
  | "In Production"
  | "Quoting"
  | "Complete"
  | "On Hold"
  | "Inactive";

export type TimeUnit = "minutes" | "seconds";

export type CustomField = {
  id: string;
  label: string;
  value: string;
};

export type Attachment = {
  id: string;
  name: string;
  kind: "gcode" | "pdf" | "cad" | "other";
  sizeLabel: string;
  uploadedAt: string;
  uploadedBy: string;
  content?: string;
  processId?: string;
  versionNumber?: number;
};

export type ProcessVersion = {
  versionNumber: number;
  status: "draft" | "current" | "archived";
  mhr: number;
  /** When set, live costing uses derived machine MHR from the factory graph. */
  machineId?: string;
  /** Unit for estimated & actual time on this version. */
  timeUnit: TimeUnit;
  timeEstimated: number;
  timeActual: number;
  customFields: CustomField[];
  files: Attachment[];
  publishedAt?: string;
  publishedBy?: string;
};

export type ProcessStep = {
  id: string;
  name: string;
  description: string;
  sequence: number;
  currentVersion: number;
  versions: ProcessVersion[];
};

export type Part = {
  id: string;
  code: string;
  name: string;
  material: string;
  /** FK to Customer master. */
  customerId: string;
  /** Denormalized display name from customer master. */
  customer: string;
  description: string;
  status: PartStatus;
  processes: ProcessStep[];
  partFiles: Attachment[];
};

export type CustomerStatus = "Active" | "Inactive";

export type Customer = {
  id: string;
  code: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  status: CustomerStatus;
  notes: string;
  createdAt: string;
  customFields: CustomField[];
};

export type EnquiryStatus = "New" | "In Review" | "Quoted" | "Closed";

export type Enquiry = {
  id: string;
  partId: string;
  reference: string;
  customerId: string;
  /** Denormalized display name from customer master. */
  customer: string;
  quantity: number;
  neededBy: string;
  quoteBy: string;
  notes: string;
  status: EnquiryStatus;
  createdAt: string;
  createdBy: string;
  customFields: CustomField[];
};

export type QuotationStatus = "Draft" | "Sent" | "Superseded" | "Inactive";

export type Quotation = {
  id: string;
  partId: string;
  enquiryId: string;
  quoteNumber: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  leadTimeDays: number;
  validUntil: string;
  terms: string;
  notes: string;
  status: QuotationStatus;
  /** Optional process-cost snapshot for margin context (display only). */
  costBasis?: number;
  createdAt: string;
  createdBy: string;
  customFields: CustomField[];
};

export type ResponseOutcome =
  | "Accepted"
  | "Rejected"
  | "Negotiate"
  | "No Response";

export type CustomerResponse = {
  id: string;
  partId: string;
  quotationId: string;
  outcome: ResponseOutcome;
  respondedAt: string;
  notes: string;
  revisedQty?: number;
  counterPrice?: number;
  createdBy: string;
  customFields: CustomField[];
};

export type AuditEvent = {
  id: string;
  timestamp: string;
  dayLabel?: string;
  actor: string;
  actorType: "user" | "system";
  eventType: "CREATE" | "UPDATE" | "UPLOAD" | "PUBLISH" | "DELETE" | "VARIANCE";
  details: string;
  entityLabel?: string;
};

export type DashboardSignal = {
  id: string;
  partCode: string;
  processName: string;
  metric: "time" | "cost";
  variancePct: number;
  message: string;
};

export type PipelineStageCount = {
  stage: string;
  count: number;
};

export type CommercialPipelineSummary = {
  partsTotal: number;
  partsByStatus: PipelineStageCount[];
  enquiriesTotal: number;
  enquiriesByStatus: PipelineStageCount[];
  quotationsTotal: number;
  quotationsByStatus: PipelineStageCount[];
  responsesTotal: number;
  responsesByOutcome: PipelineStageCount[];
};
