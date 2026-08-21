"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";
import { describeSnapshotChanges, sectionLabel } from "@/lib/v2/snapshotDiff";
import {
  auditActionLabel,
  auditActorLine,
  auditEntryDescription,
  auditEntryLabel,
  clearImpactAudit,
  formatAuditWhen,
  readImpactAudit,
  type ImpactAuditAction,
  type ImpactAuditEntry,
} from "@/lib/v2/impactAudit";
import { actorDisplayName, readSessionActor } from "@/lib/v2/sessionActor";
import { formatInr } from "@/lib/costing";
import { DataTable, type PlantColumnDef } from "@/components/plant/DataTable";
import { V2SecondaryButton } from "@/components/v2/V2Ui";
import { ConfirmDialog } from "@/components/plant/ConfirmDialog";

const ACTION_TONE: Record<ImpactAuditAction, string> = {
  adopt: "bg-primary/10 text-primary",
  scenario: "bg-surface-high text-on-surface",
  discard: "bg-on-surface-variant/10 text-on-surface-variant",
};

export default function ImpactAuditPage() {
  const { isDirty, baselineSnap, draft, draftPlantKpis } = useImpactDraft();
  const [tick, setTick] = useState(0);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("partiq-impact-audit", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("partiq-impact-audit", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const actor = useMemo(() => {
    void tick;
    return readSessionActor();
  }, [tick]);

  const entries = useMemo(() => {
    void tick;
    return readImpactAudit();
  }, [tick]);

  const pending = useMemo(
    () => (isDirty ? describeSnapshotChanges(baselineSnap, draft) : []),
    [isDirty, baselineSnap, draft],
  );

  const columns = useMemo<PlantColumnDef<ImpactAuditEntry>[]>(
    () => [
      {
        id: "when",
        header: "When",
        size: 140,
        minSize: 120,
        cell: ({ row }) => (
          <span className="font-mono text-code-sm text-on-surface-variant">
            {formatAuditWhen(row.original.at)}
          </span>
        ),
      },
      {
        id: "action",
        header: "Action",
        size: 120,
        minSize: 100,
        cell: ({ row }) => (
          <span
            className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-medium ${ACTION_TONE[row.original.action]}`}
          >
            {auditActionLabel(row.original.action)}
          </span>
        ),
      },
      {
        id: "plant",
        header: "Plant",
        size: 140,
        minSize: 110,
        cell: ({ row }) => (
          <span className="block truncate text-body-sm font-medium text-on-surface">
            {auditEntryLabel(row.original)}
          </span>
        ),
      },
      {
        id: "why",
        header: "Description",
        size: 220,
        minSize: 160,
        cell: ({ row }) => {
          const why = auditEntryDescription(row.original);
          return (
            <span className="block truncate text-body-sm text-on-surface-variant">
              {why || "—"}
            </span>
          );
        },
      },
      {
        id: "actor",
        header: "Who",
        size: 160,
        minSize: 120,
        cell: ({ row }) => (
          <span className="block truncate text-body-sm text-on-surface-variant">
            {auditActorLine(row.original)}
          </span>
        ),
      },
      {
        id: "mhr",
        header: "Blended MHR",
        size: 160,
        minSize: 130,
        cell: ({ row }) => {
          const entry = row.original;
          if (
            entry.action === "discard" ||
            entry.liveBlendedMhr == null ||
            entry.draftBlendedMhr == null
          ) {
            return (
              <span className="text-body-sm text-on-surface-variant">—</span>
            );
          }
          const delta = entry.draftBlendedMhr - entry.liveBlendedMhr;
          return (
            <span className="font-mono text-code-sm tabular-nums text-on-surface">
              {formatInr(entry.liveBlendedMhr)} → {formatInr(entry.draftBlendedMhr)}
              <span className="ml-1 text-on-surface-variant">
                ({delta >= 0 ? "+" : ""}
                {formatInr(delta)})
              </span>
            </span>
          );
        },
      },
      {
        id: "changes",
        header: "Changes",
        size: 100,
        minSize: 90,
        cell: ({ row }) => {
          const n = row.original.changes.length;
          return (
            <button
              type="button"
              className="text-body-sm font-medium text-primary hover:underline"
              onClick={() =>
                setExpandedId((id) =>
                  id === row.original.id ? null : row.original.id,
                )
              }
            >
              {n === 0 ? "None" : `${n} field${n === 1 ? "" : "s"}`}
            </button>
          );
        },
      },
    ],
    [],
  );

  const expanded = entries.find((e) => e.id === expandedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-headline-sm text-on-surface">Master data audit</h3>
          <p className="mt-1 max-w-xl text-body-sm text-on-surface-variant">
            Who committed what in Master data. Label is always the plant name;
            description is why the change happened.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-body-sm text-on-surface-variant">
            Acting as{" "}
            <span className="font-medium text-on-surface">
              {actorDisplayName(actor)}
            </span>
            {" · "}
            <Link href="/settings" className="text-primary hover:underline">
              Change name
            </Link>
          </p>
          {entries.length > 0 ? (
            <V2SecondaryButton type="button" onClick={() => setWipeOpen(true)}>
              Clear audit
            </V2SecondaryButton>
          ) : null}
        </div>
      </div>

      {pending.length > 0 ? (
        <div className="rounded-lg border border-amber-700/30 bg-amber-50/80 p-4">
          <p className="label-caps text-amber-900">Uncommitted exploration</p>
          <p className="mt-1 text-body-sm text-amber-900/80">
            {actorDisplayName(actor)} has {pending.length} change
            {pending.length === 1 ? "" : "s"} vs live. Not in the audit until
            you Save what-if, Make live, or Discard.
          </p>
          {draftPlantKpis ? (
            <p className="mt-2 font-mono text-code-sm text-amber-950">
              Draft blended Cash MHR {formatInr(draftPlantKpis.blendedMhr)}/hr
            </p>
          ) : null}
          <ul className="mt-3 space-y-1.5 text-body-sm text-on-surface">
            {pending.slice(0, 16).map((line, i) => (
              <li key={`${line.section}-${i}`} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-800" />
                <span>
                  <span className="label-caps mr-1.5 text-on-surface-variant">
                    {sectionLabel(line.section)}
                  </span>
                  {line.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-outline-variant px-5 py-12 text-center">
          <p className="text-headline-sm text-on-surface">No Master data commits yet</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Change a cost area, then Save what-if or Make live. That event will
            show who did it and what moved.
          </p>
          <Link
            href="/master-data"
            className="mt-4 inline-block text-body-sm font-medium text-primary hover:underline"
          >
            Back to Master data overview
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <DataTable
            data={entries}
            columns={columns}
            getRowId={(row) => row.id}
            minWidth={980}
            getRowClassName={(row) =>
              row.id === expandedId ? "bg-primary/5" : undefined
            }
          />
          {expanded && expanded.changes.length > 0 ? (
            <div className="rounded-lg border border-outline-variant bg-surface-lowest p-4">
              <p className="label-caps text-on-surface-variant">
                Field changes · {auditEntryLabel(expanded)}
              </p>
              <ul className="mt-3 space-y-1.5 text-body-sm text-on-surface">
                {expanded.changes.map((line, i) => (
                  <li key={`${expanded.id}-${i}`} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                      <span className="label-caps mr-1.5 text-on-surface-variant">
                        {sectionLabel(line.section)}
                      </span>
                      {line.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={wipeOpen}
        title="Clear Master data audit?"
        body="Removes the commit history stored on this computer. Live plant data is unchanged."
        confirmLabel="Clear audit"
        tone="danger"
        onClose={() => setWipeOpen(false)}
        onConfirm={() => {
          clearImpactAudit();
          setTick((t) => t + 1);
          setExpandedId(null);
        }}
      />
    </div>
  );
}
