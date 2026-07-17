export type PartStatus = "In Production" | "Quoting" | "Complete" | "On Hold";

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
  timeEstimatedMin: number;
  timeActualMin: number;
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
  customer: string;
  description: string;
  status: PartStatus;
  processes: ProcessStep[];
  partFiles: Attachment[];
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
