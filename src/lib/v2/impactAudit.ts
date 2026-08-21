import type { ImpactSectionId } from "@/lib/v2/clientDb";
import { describeSnapshotChanges } from "@/lib/v2/snapshotDiff";
import type { V2BaselineSnapshot } from "@/lib/v2/clientDb";
import { actorDisplayName, readSessionActor } from "@/lib/v2/sessionActor";

export const IMPACT_AUDIT_KEY = "partiq-impact-audit-v1";

export type ImpactAuditAction = "adopt" | "scenario" | "discard";

export type ImpactAuditChange = {
  section: ImpactSectionId;
  label: string;
};

export type ImpactAuditEntry = {
  id: string;
  at: string;
  actor: string;
  actorEmail: string;
  action: ImpactAuditAction;
  /** Constant plant name — not a per-commit rename. */
  label: string;
  /** Why this commit happened / what drove the impact. */
  description: string;
  /** @deprecated older logs used a free-form title */
  title?: string;
  changes: ImpactAuditChange[];
  liveBlendedMhr: number | null;
  draftBlendedMhr: number | null;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

export function readImpactAudit(): ImpactAuditEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(IMPACT_AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ImpactAuditEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeImpactAudit(entries: ImpactAuditEntry[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(IMPACT_AUDIT_KEY, JSON.stringify(entries));
}

export function clearImpactAudit() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(IMPACT_AUDIT_KEY);
}

export function appendImpactAudit(entry: Omit<ImpactAuditEntry, "id" | "at" | "actor" | "actorEmail"> & {
  actor?: string;
  actorEmail?: string;
}) {
  const session = readSessionActor();
  const full: ImpactAuditEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    actor: entry.actor?.trim() || session.name,
    actorEmail: entry.actorEmail?.trim() || session.email,
    action: entry.action,
    label: (entry.label ?? "").trim() || "Plant",
    description: (entry.description ?? "").trim(),
    changes: entry.changes,
    liveBlendedMhr: entry.liveBlendedMhr,
    draftBlendedMhr: entry.draftBlendedMhr,
  };
  const next = [full, ...readImpactAudit()].slice(0, 200);
  writeImpactAudit(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("partiq-impact-audit"));
  }
  return full;
}

/** Record a commit using the existing snapshot diff (does not change calc). */
export function recordImpactCommit(opts: {
  action: ImpactAuditAction;
  label: string;
  description?: string;
  live: V2BaselineSnapshot;
  draft: V2BaselineSnapshot;
  liveBlendedMhr?: number | null;
  draftBlendedMhr?: number | null;
}) {
  const changes = describeSnapshotChanges(opts.live, opts.draft);
  return appendImpactAudit({
    action: opts.action,
    label: opts.label,
    description: opts.description ?? "",
    changes,
    liveBlendedMhr: opts.liveBlendedMhr ?? null,
    draftBlendedMhr: opts.draftBlendedMhr ?? null,
  });
}

export function auditEntryLabel(entry: ImpactAuditEntry) {
  return entry.label?.trim() || entry.title?.trim() || "Plant";
}

export function auditEntryDescription(entry: ImpactAuditEntry) {
  if (entry.description?.trim()) return entry.description.trim();
  if (entry.title?.trim() && entry.title !== entry.label) return entry.title.trim();
  return "";
}

export function auditActionLabel(action: ImpactAuditAction) {
  if (action === "adopt") return "Made live";
  if (action === "scenario") return "Saved what-if";
  return "Discarded";
}

export function formatAuditWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function auditActorLine(entry: ImpactAuditEntry) {
  return actorDisplayName({ name: entry.actor, email: entry.actorEmail });
}
