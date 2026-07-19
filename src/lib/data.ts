import type {
  AuditEvent,
  CommercialPipelineSummary,
  Customer,
  CustomerResponse,
  DashboardSignal,
  Enquiry,
  Part,
  PipelineStageCount,
  Quotation,
} from "./types";
import { calcCost, toSeconds } from "./costing";

export { ORG_LABEL, PLANT_NAME } from "./brand";

export const customers: Customer[] = [
  {
    id: "cust-hydra",
    code: "CUST-HTG",
    name: "HydraTech Global",
    contactName: "Ananya Mehta",
    email: "ananya.mehta@hydratech.example",
    phone: "+91 22 4001 2200",
    city: "Pune",
    status: "Active",
    notes: "Hydraulic OEM — preferred Net 30, FOB Mumbai.",
    createdAt: "2025-11-02",
    customFields: [
      { id: "ccf1", label: "GSTIN", value: "27AABCH1234A1Z5" },
      { id: "ccf2", label: "Payment terms", value: "Net 30" },
      { id: "ccf3", label: "Account owner", value: "Ravi" },
    ],
  },
  {
    id: "cust-autoforge",
    code: "CUST-AFP",
    name: "AutoForge Pvt",
    contactName: "Priya N.",
    email: "priya.n@autoforge.example",
    phone: "+91 44 2810 4410",
    city: "Chennai",
    status: "Active",
    notes: "EV brake assemblies — PPAP Level 3 typical.",
    createdAt: "2026-01-14",
    customFields: [
      { id: "ccf4", label: "GSTIN", value: "33AADCA9988B1Z2" },
      { id: "ccf5", label: "Payment terms", value: "Net 45" },
      { id: "ccf6", label: "Incumbent supplier", value: "Yes — competitive" },
    ],
  },
  {
    id: "cust-internal",
    code: "CUST-INT",
    name: "Internal",
    contactName: "Plant stores",
    email: "stores@partiq.example",
    phone: "+91 22 6120 0100",
    city: "Mumbai",
    status: "Active",
    notes: "Internal cost transfers and blank stock.",
    createdAt: "2025-08-01",
    customFields: [
      { id: "ccf7", label: "Cost center", value: "CC-BLANK-01" },
      { id: "ccf8", label: "Transfer only", value: "Yes" },
    ],
  },
];

export const parts: Part[] = [
  {
    id: "part-mid-3060",
    code: "MID-3060",
    name: "High-pressure manifold housing",
    material: "EN1 Leaded Steel",
    customerId: "cust-hydra",
    customer: "HydraTech Global",
    description: "High-pressure manifold housing for hydraulic assembly.",
    status: "In Production",
    partFiles: [
      {
        id: "pf1",
        name: "Drawing_MID3060.pdf",
        kind: "pdf",
        sizeLabel: "1.2 MB",
        uploadedAt: "2026-07-10",
        uploadedBy: "Ravi",
      },
      {
        id: "pf2",
        name: "MID3060-3D.step",
        kind: "cad",
        sizeLabel: "8.4 MB",
        uploadedAt: "2026-07-10",
        uploadedBy: "Ravi",
      },
    ],
    processes: [
      {
        id: "proc-cnc-1",
        name: "CNC 1 - Roughing",
        description:
          "Initial block squaring and major material removal. Machine setup requires 20 mins. Tooling set T-401.",
        sequence: 1,
        currentVersion: 2,
        versions: [
          {
            versionNumber: 1,
            status: "archived",
            mhr: 1100,
            timeUnit: "minutes",
            timeEstimated: 50,
            timeActual: 48,
            customFields: [
              { id: "cf0", label: "Tooling Type", value: "HSS Rough Mill" },
            ],
            files: [
              {
                id: "f-old",
                name: "O3060_v1.P-2",
                kind: "gcode",
                sizeLabel: "3.8 KB",
                uploadedAt: "2026-07-01",
                uploadedBy: "S. Smith",
                versionNumber: 1,
              },
            ],
            publishedAt: "2026-07-01 09:00",
            publishedBy: "S. Smith",
          },
          {
            versionNumber: 2,
            status: "current",
            mhr: 1250,
            timeUnit: "minutes",
            timeEstimated: 45,
            timeActual: 52,
            customFields: [
              { id: "cf1", label: "Tooling Type", value: "Carbide End Mill" },
              { id: "cf2", label: "Coolant", value: "Synthetic Emulsion" },
              { id: "cf3", label: "Work Center", value: "WC-CNC-04" },
              { id: "cf4", label: "Input Dia", value: "25 mm" },
              { id: "cf5", label: "Input Weight", value: "25 grams" },
            ],
            files: [
              {
                id: "f1",
                name: "O3060.P-2",
                kind: "gcode",
                sizeLabel: "4.2 KB",
                uploadedAt: "Today 09:41",
                uploadedBy: "J. Doe",
                versionNumber: 2,
              },
              {
                id: "f2",
                name: "setup_sheet_v2.pdf",
                kind: "pdf",
                sizeLabel: "1.2 MB",
                uploadedAt: "Yesterday",
                uploadedBy: "Ravi",
                versionNumber: 2,
              },
              {
                id: "f3",
                name: "macro_vars.nc",
                kind: "gcode",
                sizeLabel: "1 KB",
                uploadedAt: "Yesterday",
                uploadedBy: "Ravi",
                versionNumber: 2,
              },
            ],
            publishedAt: "2026-07-15 09:30",
            publishedBy: "Admin",
          },
          {
            versionNumber: 3,
            status: "draft",
            mhr: 1250,
            timeUnit: "minutes",
            timeEstimated: 42,
            timeActual: 0,
            customFields: [
              { id: "cf1", label: "Tooling Type", value: "Carbide End Mill" },
              { id: "cf2", label: "Coolant", value: "Synthetic Emulsion" },
            ],
            files: [],
          },
        ],
      },
      {
        id: "proc-cnc-2",
        name: "CNC 2 - Finishing Profiles",
        description:
          "Contour finishing and deep pocket milling. Critical tolerance ±0.01mm on bore B2.",
        sequence: 2,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            status: "current",
            mhr: 1400,
            timeUnit: "minutes",
            timeEstimated: 135,
            timeActual: 135,
            customFields: [
              { id: "c1", label: "Tolerance", value: "±0.01 mm" },
            ],
            files: [
              {
                id: "fc2",
                name: "F3060.P-1",
                kind: "gcode",
                sizeLabel: "6.1 KB",
                uploadedAt: "2026-07-12",
                uploadedBy: "Ravi",
                versionNumber: 1,
              },
              {
                id: "fc2b",
                name: "Setup_Sheet_Finish.pdf",
                kind: "pdf",
                sizeLabel: "980 KB",
                uploadedAt: "2026-07-12",
                uploadedBy: "Ravi",
                versionNumber: 1,
              },
            ],
            publishedAt: "2026-07-12 14:00",
            publishedBy: "Ravi",
          },
        ],
      },
      {
        id: "proc-vmc-1",
        name: "VMC 1 - Drilling & Tapping",
        description:
          "M6 and M8 threaded hole generation. Ensure proper coolant flow for tap life.",
        sequence: 3,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            status: "current",
            mhr: 950,
            timeUnit: "seconds",
            timeEstimated: 1800,
            timeActual: 2700,
            customFields: [{ id: "v1", label: "Tap Size", value: "M6 / M8" }],
            files: [],
            publishedAt: "2026-07-14 11:00",
            publishedBy: "J. Doe",
          },
        ],
      },
    ],
  },
  {
    id: "part-brk-118",
    code: "BRK-118",
    name: "Brake caliper bracket",
    material: "AL6061-T6",
    customerId: "cust-autoforge",
    customer: "AutoForge Pvt",
    description: "Lightweight bracket for EV brake assembly.",
    status: "Quoting",
    partFiles: [],
    processes: [
      {
        id: "proc-vmc-brk",
        name: "VMC 1 - Pocketing",
        description: "3-axis pocketing and facing.",
        sequence: 1,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            status: "current",
            mhr: 800,
            timeUnit: "minutes",
            timeEstimated: 22,
            timeActual: 28,
            customFields: [],
            files: [],
            publishedAt: "2026-07-16 10:00",
            publishedBy: "Ravi",
          },
        ],
      },
    ],
  },
  {
    id: "part-shp-441",
    code: "SHP-441",
    name: "Shaft collar blank",
    material: "EN8",
    customerId: "cust-internal",
    customer: "Internal",
    description: "Blank ready for secondary ops.",
    status: "Complete",
    partFiles: [],
    processes: [
      {
        id: "proc-cnc-shp",
        name: "CNC 1 - Turning",
        description: "OD turn and face.",
        sequence: 1,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            status: "current",
            mhr: 1000,
            timeUnit: "minutes",
            timeEstimated: 12,
            timeActual: 11,
            customFields: [],
            files: [],
            publishedAt: "2026-07-08 08:00",
            publishedBy: "S. Smith",
          },
        ],
      },
    ],
  },
];

export const enquiries: Enquiry[] = [
  {
    id: "enq-brk-1",
    partId: "part-brk-118",
    reference: "ENQ-2026-041",
    customerId: "cust-autoforge",
    customer: "AutoForge Pvt",
    quantity: 500,
    neededBy: "2026-08-15",
    quoteBy: "2026-07-25",
    notes: "EV brake bracket — anodize after machining. Target annual volume 2k.",
    status: "Quoted",
    createdAt: "2026-07-12",
    createdBy: "Ravi",
    customFields: [
      { id: "ecf1", label: "Drawing Rev", value: "C" },
      { id: "ecf2", label: "Surface Finish", value: "Ra 1.6" },
      { id: "ecf3", label: "Anodize", value: "Black Type II" },
    ],
  },
  {
    id: "enq-brk-2",
    partId: "part-brk-118",
    reference: "ENQ-2026-055",
    customerId: "cust-autoforge",
    customer: "AutoForge Pvt",
    quantity: 120,
    neededBy: "2026-09-01",
    quoteBy: "2026-07-28",
    notes: "Pilot lot for design validation. Soft tooling acceptable.",
    status: "In Review",
    createdAt: "2026-07-18",
    createdBy: "J. Doe",
    customFields: [
      { id: "ecf4", label: "Drawing Rev", value: "D (draft)" },
      { id: "ecf5", label: "PPAP level", value: "Level 3" },
    ],
  },
  {
    id: "enq-mid-1",
    partId: "part-mid-3060",
    reference: "ENQ-2026-019",
    customerId: "cust-hydra",
    customer: "HydraTech Global",
    quantity: 200,
    neededBy: "2026-07-30",
    quoteBy: "2026-06-20",
    notes: "Repeat order for manifold housing — same rev as last PO.",
    status: "Closed",
    createdAt: "2026-06-10",
    createdBy: "Ravi",
    customFields: [
      { id: "ecf6", label: "Drawing Rev", value: "B" },
      { id: "ecf7", label: "Pressure rating", value: "350 bar" },
    ],
  },
  {
    id: "enq-shp-1",
    partId: "part-shp-441",
    reference: "ENQ-2026-033",
    customerId: "cust-internal",
    customer: "Internal",
    quantity: 1000,
    neededBy: "2026-07-01",
    quoteBy: "2026-06-15",
    notes: "Internal blank for secondary ops stock.",
    status: "Closed",
    createdAt: "2026-06-05",
    createdBy: "S. Smith",
    customFields: [{ id: "ecf8", label: "Stock grade", value: "EN8 bright" }],
  },
  {
    id: "enq-mid-2",
    partId: "part-mid-3060",
    reference: "ENQ-2026-062",
    customerId: "cust-hydra",
    customer: "HydraTech Global",
    quantity: 80,
    neededBy: "2026-09-20",
    quoteBy: "2026-08-05",
    notes: "New variant with alternate port layout — awaiting CAD release.",
    status: "New",
    createdAt: "2026-07-17",
    createdBy: "Ravi",
    customFields: [
      { id: "ecf9", label: "Drawing Rev", value: "Pending" },
      { id: "ecf10", label: "NDA", value: "Signed 2026-07-16" },
    ],
  },
];

export const quotations: Quotation[] = [
  {
    id: "quo-brk-1",
    partId: "part-brk-118",
    enquiryId: "enq-brk-1",
    quoteNumber: "Q-2026-118-A",
    unitPrice: 485,
    currency: "INR",
    quantity: 500,
    leadTimeDays: 21,
    validUntil: "2026-08-10",
    terms: "Net 45 · Ex-works Mumbai · Tooling amortized over 2k pcs",
    notes: "Includes anodize subcontractor margin.",
    status: "Sent",
    costBasis: 373,
    createdAt: "2026-07-14",
    createdBy: "Ravi",
    customFields: [
      { id: "qcf1", label: "Tooling", value: "₹45,000 one-time" },
      { id: "qcf2", label: "Payment Terms", value: "Net 45" },
      { id: "qcf3", label: "MOQ", value: "250" },
    ],
  },
  {
    id: "quo-brk-2",
    partId: "part-brk-118",
    enquiryId: "enq-brk-1",
    quoteNumber: "Q-2026-118-B",
    unitPrice: 460,
    currency: "INR",
    quantity: 500,
    leadTimeDays: 28,
    validUntil: "2026-08-20",
    terms: "Net 30 · Ex-works Mumbai",
    notes: "Revised after customer negotiate — longer lead, lower unit.",
    status: "Sent",
    costBasis: 373,
    createdAt: "2026-07-16",
    createdBy: "Ravi",
    customFields: [
      { id: "qcf4", label: "Tooling", value: "₹45,000 one-time" },
      { id: "qcf5", label: "Revision of", value: "Q-2026-118-A" },
    ],
  },
  {
    id: "quo-mid-1",
    partId: "part-mid-3060",
    enquiryId: "enq-mid-1",
    quoteNumber: "Q-2026-060-A",
    unitPrice: 2450,
    currency: "INR",
    quantity: 200,
    leadTimeDays: 35,
    validUntil: "2026-07-15",
    terms: "Net 30 · FOB Mumbai",
    notes: "Matched prior PO pricing.",
    status: "Superseded",
    costBasis: 5503,
    createdAt: "2026-06-14",
    createdBy: "J. Doe",
    customFields: [{ id: "qcf6", label: "Prior PO", value: "PO-HT-8841" }],
  },
  {
    id: "quo-mid-2",
    partId: "part-mid-3060",
    enquiryId: "enq-mid-1",
    quoteNumber: "Q-2026-060-B",
    unitPrice: 2380,
    currency: "INR",
    quantity: 200,
    leadTimeDays: 35,
    validUntil: "2026-07-20",
    terms: "Net 30 · FOB Mumbai",
    notes: "Final accepted quote.",
    status: "Sent",
    costBasis: 5503,
    createdAt: "2026-06-18",
    createdBy: "J. Doe",
    customFields: [
      { id: "qcf7", label: "Prior PO", value: "PO-HT-8841" },
      { id: "qcf8", label: "Discount", value: "2.9% volume" },
    ],
  },
  {
    id: "quo-shp-1",
    partId: "part-shp-441",
    enquiryId: "enq-shp-1",
    quoteNumber: "Q-2026-441-A",
    unitPrice: 95,
    currency: "INR",
    quantity: 1000,
    leadTimeDays: 10,
    validUntil: "2026-06-30",
    terms: "Internal transfer",
    notes: "Internal cost transfer — no commercial margin.",
    status: "Sent",
    costBasis: 183,
    createdAt: "2026-06-08",
    createdBy: "S. Smith",
    customFields: [{ id: "qcf9", label: "Cost center", value: "CC-BLANK-01" }],
  },
  {
    id: "quo-brk-3",
    partId: "part-brk-118",
    enquiryId: "enq-brk-2",
    quoteNumber: "Q-2026-118-C",
    unitPrice: 520,
    currency: "INR",
    quantity: 120,
    leadTimeDays: 18,
    validUntil: "2026-08-15",
    terms: "Net 30 · Soft tooling included",
    notes: "Draft pilot quote — not yet sent.",
    status: "Draft",
    costBasis: 373,
    createdAt: "2026-07-19",
    createdBy: "J. Doe",
    customFields: [
      { id: "qcf10", label: "Soft tooling", value: "₹12,000" },
      { id: "qcf11", label: "PPAP", value: "Included" },
    ],
  },
];

export const customerResponses: CustomerResponse[] = [
  {
    id: "resp-brk-1",
    partId: "part-brk-118",
    quotationId: "quo-brk-1",
    outcome: "Negotiate",
    respondedAt: "2026-07-15",
    notes: "Price high vs incumbent. Can accept if lead time flexible.",
    counterPrice: 450,
    revisedQty: 500,
    createdBy: "Ravi",
    customFields: [
      { id: "rcf1", label: "Contact", value: "Priya N. (Purchasing)" },
      { id: "rcf2", label: "Channel", value: "Email" },
    ],
  },
  {
    id: "resp-brk-2",
    partId: "part-brk-118",
    quotationId: "quo-brk-2",
    outcome: "Accepted",
    respondedAt: "2026-07-17",
    notes: "Accepted revised quote. PO to follow within 5 days.",
    createdBy: "Ravi",
    customFields: [
      { id: "rcf3", label: "Contact", value: "Priya N. (Purchasing)" },
      { id: "rcf4", label: "Expected PO", value: "2026-07-22" },
    ],
  },
  {
    id: "resp-mid-1",
    partId: "part-mid-3060",
    quotationId: "quo-mid-2",
    outcome: "Accepted",
    respondedAt: "2026-06-22",
    notes: "PO-HT-9102 issued against Q-2026-060-B.",
    createdBy: "J. Doe",
    customFields: [
      { id: "rcf5", label: "PO Number", value: "PO-HT-9102" },
      { id: "rcf6", label: "Channel", value: "Portal" },
    ],
  },
  {
    id: "resp-shp-1",
    partId: "part-shp-441",
    quotationId: "quo-shp-1",
    outcome: "Accepted",
    respondedAt: "2026-06-09",
    notes: "Internal approval — transfer booked.",
    createdBy: "S. Smith",
    customFields: [{ id: "rcf7", label: "Transfer ref", value: "IT-441-06" }],
  },
  {
    id: "resp-mid-2",
    partId: "part-mid-3060",
    quotationId: "quo-mid-1",
    outcome: "Rejected",
    respondedAt: "2026-06-16",
    notes: "Rejected in favor of volume discount revision.",
    createdBy: "J. Doe",
    customFields: [{ id: "rcf8", label: "Reason code", value: "PRICE" }],
  },
];

export const auditEvents: AuditEvent[] = [
  {
    id: "a1",
    timestamp: "10:42:15",
    actor: "Ravi",
    actorType: "user",
    eventType: "UPDATE",
    details: "updated MHR ₹1100 → ₹1250",
    entityLabel: "CNC 1",
  },
  {
    id: "a2",
    timestamp: "09:30:04",
    actor: "System",
    actorType: "system",
    eventType: "PUBLISH",
    details: "Version v2 published by Admin",
    entityLabel: "CNC 1",
  },
  {
    id: "a3",
    timestamp: "16:20:00",
    dayLabel: "Yesterday",
    actor: "J. Doe",
    actorType: "user",
    eventType: "UPLOAD",
    details: "uploaded O3060.P-2 (v2)",
    entityLabel: "CNC 1",
  },
  {
    id: "a4",
    timestamp: "11:15:33",
    dayLabel: "Jul 15",
    actor: "Automated Process",
    actorType: "system",
    eventType: "VARIANCE",
    details: "Actual Time updated 45 → 52 min",
    entityLabel: "CNC 1",
  },
  {
    id: "a5",
    timestamp: "08:05:12",
    dayLabel: "Jul 14",
    actor: "S. Smith",
    actorType: "user",
    eventType: "CREATE",
    details: "Created process step CNC 1 - Roughing",
    entityLabel: "MID-3060",
  },
  {
    id: "a6",
    timestamp: "17:02:40",
    dayLabel: "Jul 12",
    actor: "Ravi",
    actorType: "user",
    eventType: "UPLOAD",
    details: "uploaded F3060.P-1 (v1)",
    entityLabel: "CNC 2",
  },
];

export const dashboardSignals: DashboardSignal[] = [
  {
    id: "s1",
    partCode: "MID-3060",
    processName: "CNC 1",
    metric: "time",
    variancePct: 15.5,
    message: "Actual time overrun vs estimate",
  },
  {
    id: "s2",
    partCode: "MID-3060",
    processName: "VMC 1",
    metric: "time",
    variancePct: 50,
    message: "Tapping cycle 15 min over estimate",
  },
  {
    id: "s3",
    partCode: "BRK-118",
    processName: "VMC 1",
    metric: "cost",
    variancePct: 27.3,
    message: "Cost overrun from extended pocketing",
  },
];

/** Plant-wide aggregate weekly Est/Act cost (all parts). */
export const plantWeeklyTrend = [
  { week: "W23", estimated: 9200, actual: 9800 },
  { week: "W24", estimated: 8800, actual: 9100 },
  { week: "W25", estimated: 10200, actual: 11100 },
  { week: "W26", estimated: 9700, actual: 10450 },
  { week: "W27", estimated: 10500, actual: 11800 },
  { week: "W28", estimated: 9900, actual: 10620 },
];

/** Dummy weekly Est/Act cost trend keyed by part id */
export const partWeeklyTrends: Record<
  string,
  { week: string; estimated: number; actual: number }[]
> = {
  "part-mid-3060": [
    { week: "W23", estimated: 4800, actual: 5100 },
    { week: "W24", estimated: 4650, actual: 4900 },
    { week: "W25", estimated: 5200, actual: 5750 },
    { week: "W26", estimated: 5050, actual: 5480 },
    { week: "W27", estimated: 5400, actual: 6100 },
    { week: "W28", estimated: 5056, actual: 5503 },
  ],
  "part-brk-118": [
    { week: "W23", estimated: 280, actual: 310 },
    { week: "W24", estimated: 290, actual: 340 },
    { week: "W25", estimated: 300, actual: 380 },
    { week: "W26", estimated: 295, actual: 360 },
    { week: "W27", estimated: 310, actual: 395 },
    { week: "W28", estimated: 293, actual: 373 },
  ],
  "part-shp-441": [
    { week: "W23", estimated: 190, actual: 185 },
    { week: "W24", estimated: 200, actual: 195 },
    { week: "W25", estimated: 210, actual: 200 },
    { week: "W26", estimated: 195, actual: 190 },
    { week: "W27", estimated: 205, actual: 198 },
    { week: "W28", estimated: 200, actual: 183 },
  ],
};

export function getPart(partId: string): Part | undefined {
  return parts.find((p) => p.id === partId);
}

export function getCustomer(customerId: string): Customer | undefined {
  return customers.find((c) => c.id === customerId);
}

export function getCustomerName(customerId: string): string {
  return getCustomer(customerId)?.name ?? "Unknown customer";
}

export function getPartsForCustomer(customerId: string): Part[] {
  return parts.filter((p) => p.customerId === customerId);
}

export function getEnquiriesForCustomer(customerId: string): Enquiry[] {
  return enquiries.filter((e) => e.customerId === customerId);
}

/**
 * Cost trend across versions of one process (or all processes if processId omitted).
 * Points ordered by version number for line charts.
 */
export function getProcessVersionCostTrend(partId: string, processId?: string) {
  const part = getPart(partId);
  if (!part) return [];

  const processes = processId
    ? part.processes.filter((p) => p.id === processId)
    : part.processes;

  return processes.flatMap((proc) =>
    [...proc.versions]
      .sort((a, b) => a.versionNumber - b.versionNumber)
      .map((v) => {
        const est = calcCost(v.mhr, v.timeEstimated, v.timeUnit);
        const act =
          v.timeActual > 0 ? calcCost(v.mhr, v.timeActual, v.timeUnit) : null;
        return {
          key: `v${v.versionNumber}`,
          label: `v${v.versionNumber}`,
          processId: proc.id,
          processName: proc.name.split(" - ")[0],
          versionNumber: v.versionNumber,
          status: v.status,
          estimated: Math.round(est * 100) / 100,
          actual: act === null ? null : Math.round(act * 100) / 100,
        };
      }),
  );
}

export function getPartSignals(partCode: string) {
  return dashboardSignals.filter((s) => s.partCode === partCode);
}

/** Totals: costs in currency; times aggregated as seconds for mixed units. */
export function getPlantTotals() {
  let estCost = 0;
  let actCost = 0;
  let estTimeSec = 0;
  let actTimeSec = 0;
  parts.forEach((part) => {
    part.processes.forEach((proc) => {
      const v = getCurrentVersion(proc);
      estCost += calcCost(v.mhr, v.timeEstimated, v.timeUnit);
      actCost += calcCost(v.mhr, v.timeActual, v.timeUnit);
      estTimeSec += toSeconds(v.timeEstimated, v.timeUnit);
      actTimeSec += toSeconds(v.timeActual, v.timeUnit);
    });
  });
  return { estCost, actCost, estTimeSec, actTimeSec };
}


export function getProcess(partId: string, processId: string) {
  const part = getPart(partId);
  if (!part) return undefined;
  const process = part.processes.find((p) => p.id === processId);
  if (!process) return undefined;
  return { part, process };
}

export function getCurrentVersion(process: Part["processes"][number]) {
  return (
    process.versions.find((v) => v.versionNumber === process.currentVersion) ??
    process.versions[process.versions.length - 1]
  );
}

export function getEnquiriesForPart(partId: string): Enquiry[] {
  return enquiries.filter((e) => e.partId === partId);
}

export function getEnquiry(enquiryId: string): Enquiry | undefined {
  return enquiries.find((e) => e.id === enquiryId);
}

export function getQuotationsForPart(partId: string): Quotation[] {
  return quotations.filter((q) => q.partId === partId);
}

export function getQuotationsForEnquiry(enquiryId: string): Quotation[] {
  return quotations.filter((q) => q.enquiryId === enquiryId);
}

export function getQuotation(quotationId: string): Quotation | undefined {
  return quotations.find((q) => q.id === quotationId);
}

export function getResponsesForPart(partId: string): CustomerResponse[] {
  return customerResponses.filter((r) => r.partId === partId);
}

export function getResponsesForQuotation(quotationId: string): CustomerResponse[] {
  return customerResponses.filter((r) => r.quotationId === quotationId);
}

export function getCustomerResponse(responseId: string): CustomerResponse | undefined {
  return customerResponses.find((r) => r.id === responseId);
}

export function getCommercialSummaryForPart(partId: string) {
  return {
    enquiries: getEnquiriesForPart(partId),
    quotations: getQuotationsForPart(partId),
    responses: getResponsesForPart(partId),
  };
}

function countByStage<T extends string>(
  items: { stage: T }[],
  allStages: readonly T[],
): PipelineStageCount[] {
  const map = new Map<string, number>(allStages.map((s) => [s, 0]));
  items.forEach((item) => {
    map.set(item.stage, (map.get(item.stage) ?? 0) + 1);
  });
  return allStages.map((stage) => ({ stage, count: map.get(stage) ?? 0 }));
}

/** Plant-wide commercial + part pipeline counts for dashboard analytics. */
export function getCommercialPipelineSummary(): CommercialPipelineSummary {
  const partStatuses = ["In Production", "Quoting", "Complete", "On Hold"] as const;
  const enquiryStatuses = ["New", "In Review", "Quoted", "Closed"] as const;
  const quotationStatuses = ["Draft", "Sent", "Superseded"] as const;
  const responseOutcomes = [
    "Accepted",
    "Rejected",
    "Negotiate",
    "No Response",
  ] as const;

  return {
    partsTotal: parts.length,
    partsByStatus: countByStage(
      parts.map((p) => ({ stage: p.status })),
      partStatuses,
    ),
    enquiriesTotal: enquiries.length,
    enquiriesByStatus: countByStage(
      enquiries.map((e) => ({ stage: e.status })),
      enquiryStatuses,
    ),
    quotationsTotal: quotations.length,
    quotationsByStatus: countByStage(
      quotations.map((q) => ({ stage: q.status })),
      quotationStatuses,
    ),
    responsesTotal: customerResponses.length,
    responsesByOutcome: countByStage(
      customerResponses.map((r) => ({ stage: r.outcome })),
      responseOutcomes,
    ),
  };
}

