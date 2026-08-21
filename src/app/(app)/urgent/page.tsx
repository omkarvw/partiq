"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  FilePlus2,
  Handshake,
  Siren,
  ThumbsUp,
} from "lucide-react";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { AnimatedNumber, Reveal } from "@/components/motion/motion-kit";
import { listUrgentParts, type UrgentPartRow } from "@/lib/factory/selectors";
import { formatInr } from "@/lib/costing";
import { Button, StatusChip } from "@/components/ui/Primitives";
import { RescueQuoteModal } from "@/components/commercial/RescueQuoteModal";
import {
  acceptBelowGoal,
  priceForTargetGrossMargin,
} from "@/lib/commercial/entityStore";
import { markStory } from "@/components/story/StoryChecklist";
import { DataTable, type PlantColumnDef } from "@/components/plant/DataTable";

export default function UrgentPage() {
  const { breakups, record } = useV2Graph();
  const goal = record.plant.targetGrossMarginPct ?? 20;
  const [rescue, setRescue] = useState<{
    row: UrgentPartRow;
    mode: "single" | "all";
  } | null>(null);
  const [tick, setTick] = useState(0);

  const fmtMargin = useCallback((v: number) => `${v.toFixed(1)}%`, []);

  const rows = useMemo(
    () =>
      listUrgentParts(
        breakups,
        goal,
        record.machines,
        record.materialGrades ?? [],
      ),
    // tick forces refresh after local quote create / accept
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [breakups, goal, record.machines, record.materialGrades, tick],
  );

  const underwaterCount = rows.filter((r) => r.reason === "underwater").length;

  const columns = useMemo<PlantColumnDef<UrgentPartRow>[]>(
    () => [
      {
        id: "part",
        header: "Part",
        size: 180,
        minSize: 140,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-error" />
            <div className="min-w-0">
              <Link
                href={`/parts/${row.original.partId}`}
                className="font-mono text-code-md font-medium text-primary hover:underline"
              >
                {row.original.code}
              </Link>
              <p className="truncate text-body-sm text-on-surface-variant">
                {row.original.name}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "quote",
        header: "Quote",
        size: 140,
        minSize: 110,
        cell: ({ row }) => (
          <Link
            href={`/parts/${row.original.partId}/quotations/${row.original.quotationId}`}
            className="font-mono text-code-md font-medium text-primary hover:underline"
          >
            {row.original.quoteNumber}
          </Link>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        size: 140,
        minSize: 110,
        cell: ({ row }) => (
          <span className="block truncate text-body-sm text-on-surface-variant">
            {row.original.customer}
          </span>
        ),
      },
      {
        id: "cost",
        header: "Process cost",
        size: 110,
        minSize: 90,
        cell: ({ row }) => (
          <span className="font-mono text-code-sm tabular-nums">
            {formatInr(row.original.economics.costBasis)}
          </span>
        ),
      },
      {
        id: "price",
        header: "Current price",
        size: 110,
        minSize: 90,
        cell: ({ row }) => (
          <span className="font-mono text-code-sm tabular-nums">
            {formatInr(row.original.economics.unitPrice)}
          </span>
        ),
      },
      {
        id: "rescue",
        header: "Rescue price",
        size: 130,
        minSize: 110,
        cell: ({ row }) => {
          const rescuePrice = priceForTargetGrossMargin(
            row.original.economics.costBasis,
            goal,
          );
          return (
            <div>
              <span className="font-mono text-code-sm font-semibold tabular-nums text-primary">
                {formatInr(rescuePrice)}
              </span>
              <p className="mt-0.5 text-[11px] text-on-surface-variant">
                for {goal.toFixed(1)}% margin
              </p>
            </div>
          );
        },
      },
      {
        id: "margin",
        header: "Margin",
        size: 120,
        minSize: 100,
        cell: ({ row }) => {
          const margin = row.original.economics.grossMarginPct ?? 0;
          return (
            <div>
              <AnimatedNumber
                value={margin}
                format={fmtMargin}
                className="text-code-md font-semibold text-error"
              />
              <p className="mt-0.5 text-[11px] text-on-surface-variant">
                {row.original.reason === "underwater"
                  ? "Quote underwater"
                  : "Below goal"}
              </p>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        size: 100,
        minSize: 80,
        cell: ({ row }) => (
          <StatusChip
            status={
              row.original.reason === "underwater"
                ? "On Hold"
                : row.original.status
            }
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 280,
        minSize: 220,
        cell: ({ row }) => {
          const margin = row.original.economics.grossMarginPct ?? 0;
          return (
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {row.original.reason === "below_goal" ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    acceptBelowGoal({
                      quotationId: row.original.quotationId,
                      partId: row.original.partId,
                      acceptedAt: new Date().toISOString(),
                      goalPct: goal,
                      marginPct: margin,
                    });
                    markStory("urgent_act");
                    setTick((t) => t + 1);
                  }}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Accept
                </Button>
              ) : null}
              <Button
                variant="secondary"
                onClick={() => setRescue({ row: row.original, mode: "all" })}
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                New quotes
              </Button>
              <Link
                href={`/parts/${row.original.partId}/quotations/${row.original.quotationId}`}
                className="press inline-flex items-center gap-1 text-body-sm font-medium text-primary hover:underline"
              >
                Open <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          );
        },
      },
    ],
    [fmtMargin, goal],
  );

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <Reveal>
        <div className="overflow-hidden rounded-lg border border-error/25 bg-[linear-gradient(135deg,#fff7f6_0%,#ffffff_55%,#f8fafc_100%)] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-error/10 text-error">
                <Siren className="h-5 w-5" />
              </span>
              <div>
                <p className="label-caps text-error">Margin triage</p>
                <h2 className="mt-1 text-headline-lg tracking-tight text-on-surface">
                  Urgent
                </h2>
                <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">
                  Latest quote per customer on a part — when it misses your{" "}
                  <span className="font-mono font-semibold text-on-surface">
                    {goal.toFixed(1)}%
                  </span>{" "}
                  gross margin goal or is underwater vs live part cost. Older
                  quotes for the same buyer stay out of this list.
                </p>
              </div>
            </div>
            <Link href="/master-data/plant" className="press">
              <Button variant="secondary">Edit margin goal</Button>
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-outline-variant bg-surface-lowest px-4 py-3">
              <p className="label-caps text-on-surface-variant">At-risk quotes</p>
              <AnimatedNumber
                value={rows.length}
                format={(v) => `${Math.round(v)}`}
                className="mt-1 block text-headline-md font-semibold text-error"
              />
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface-lowest px-4 py-3">
              <p className="label-caps text-on-surface-variant">Underwater</p>
              <AnimatedNumber
                value={underwaterCount}
                format={(v) => `${Math.round(v)}`}
                className="mt-1 block text-headline-md font-semibold text-on-surface"
              />
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface-lowest px-4 py-3">
              <p className="label-caps text-on-surface-variant">Goal margin</p>
              <p className="mt-1 font-mono text-headline-md font-semibold tabular-nums text-primary">
                {goal.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {rows.length === 0 ? (
        <Reveal delay={0.06}>
          <div className="flex flex-col items-center rounded-lg border border-outline-variant px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-primary/40 text-primary">
              <Handshake className="h-5 w-5" />
            </div>
            <p className="mt-4 text-headline-sm text-on-surface">
              Nothing urgent
            </p>
            <p className="mt-1 max-w-sm text-body-sm text-on-surface-variant">
              Every active quote is at or above your {goal.toFixed(1)}% margin
              goal. Check back after plant cost changes in Master data.
            </p>
            <Link href="/parts" className="press mt-6">
              <Button variant="secondary">Browse parts</Button>
            </Link>
          </div>
        </Reveal>
      ) : (
        <Reveal delay={0.06}>
          <DataTable
            data={rows}
            columns={columns}
            getRowId={(row) => row.quotationId}
            minWidth={1100}
            getRowClassName={(row) =>
              row.reason === "underwater"
                ? "bg-error-container/35"
                : "bg-error-container/15"
            }
          />
        </Reveal>
      )}

      {rescue ? (
        <RescueQuoteModal
          open
          mode={rescue.mode}
          onClose={() => setRescue(null)}
          partId={rescue.row.partId}
          costBasis={rescue.row.economics.costBasis}
          currentUnitPrice={rescue.row.economics.unitPrice}
          targetGrossMarginPct={goal}
          onCreated={() => {
            setTick((t) => t + 1);
            setRescue(null);
          }}
        />
      ) : null}
    </div>
  );
}
