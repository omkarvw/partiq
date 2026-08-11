"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowUpRight,
  FilePlus2,
  Handshake,
  Siren,
  ThumbsUp,
} from "lucide-react";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import {
  AnimatedNumber,
  EASE,
  Reveal,
} from "@/components/motion/motion-kit";
import { listUrgentParts, type UrgentPartRow } from "@/lib/factory/selectors";
import { formatInr } from "@/lib/costing";
import { Button, StatusChip } from "@/components/ui/Primitives";
import { RescueQuoteModal } from "@/components/commercial/RescueQuoteModal";
import {
  acceptBelowGoal,
  priceForTargetGrossMargin,
} from "@/lib/commercial/entityStore";
import { markStory } from "@/components/story/StoryChecklist";

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
    () => listUrgentParts(breakups, goal, record.machines),
    // tick forces refresh after local quote create / accept
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [breakups, goal, record.machines, tick],
  );

  const underwaterCount = rows.filter((r) => r.reason === "underwater").length;

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <Reveal>
        <div className="card-surface overflow-hidden rounded-2xl border border-error/25 bg-[linear-gradient(135deg,#fff7f6_0%,#ffffff_55%,#f8fafc_100%)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10 text-error">
                <Siren className="h-5 w-5" />
              </span>
              <div>
                <p className="label-caps text-error">Margin triage</p>
                <h2 className="mt-1 text-headline-lg tracking-tight text-on-surface">
                  Urgent
                </h2>
                <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">
                  Parts where live process cost vs quote misses your{" "}
                  <span className="font-mono font-semibold text-on-surface">
                    {goal.toFixed(1)}%
                  </span>{" "}
                  gross margin goal — or the quote is underwater. Accept the
                  below-goal margin, or raise new quotes for every customer
                  currently quoted on the part.
                </p>
              </div>
            </div>
            <Link href="/impact/plant" className="press">
              <Button variant="secondary">Edit margin goal</Button>
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-outline-variant bg-surface-lowest px-4 py-3">
              <p className="label-caps text-on-surface-variant">At risk</p>
              <AnimatedNumber
                value={rows.length}
                format={(v) => `${Math.round(v)}`}
                className="mt-1 block text-headline-md font-semibold text-error"
              />
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-lowest px-4 py-3">
              <p className="label-caps text-on-surface-variant">Underwater</p>
              <AnimatedNumber
                value={underwaterCount}
                format={(v) => `${Math.round(v)}`}
                className="mt-1 block text-headline-md font-semibold text-on-surface"
              />
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-lowest px-4 py-3">
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
          <div className="card-surface flex flex-col items-center rounded-2xl border border-outline-variant px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-primary/40 text-primary">
              <Handshake className="h-5 w-5" />
            </div>
            <p className="mt-4 text-headline-sm text-on-surface">
              Nothing urgent
            </p>
            <p className="mt-1 max-w-sm text-body-sm text-on-surface-variant">
              Every quoted part is at or above your {goal.toFixed(1)}% margin
              goal. Check back after plant cost changes in Impact.
            </p>
            <Link href="/parts" className="press mt-6">
              <Button variant="secondary">Browse parts</Button>
            </Link>
          </div>
        </Reveal>
      ) : (
        <Reveal
          delay={0.06}
          className="card-surface overflow-hidden rounded-2xl border border-outline-variant"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left">
              <thead className="bg-surface-low">
                <tr className="label-caps text-on-surface-variant">
                  <th className="px-4 py-2.5 font-bold">Part</th>
                  <th className="px-4 py-2.5 font-bold">Customer</th>
                  <th className="px-4 py-2.5 font-bold">Process cost</th>
                  <th className="px-4 py-2.5 font-bold">Current price</th>
                  <th className="px-4 py-2.5 font-bold">Rescue price</th>
                  <th className="px-4 py-2.5 font-bold">Margin</th>
                  <th className="px-4 py-2.5 font-bold">Status</th>
                  <th className="px-4 py-2.5 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const margin = row.economics.grossMarginPct ?? 0;
                  const rescuePrice = priceForTargetGrossMargin(
                    row.economics.costBasis,
                    goal,
                  );
                  return (
                    <motion.tr
                      key={row.partId}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.28,
                        ease: EASE,
                        delay: Math.min(i * 0.04, 0.32),
                      }}
                      className={
                        row.reason === "underwater"
                          ? "border-t border-error/20 bg-error-container/35"
                          : "border-t border-outline-variant/50 bg-error-container/15"
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-error" />
                          <div>
                            <Link
                              href={`/parts/${row.partId}`}
                              className="font-mono text-code-md font-medium text-primary hover:underline"
                            >
                              {row.code}
                            </Link>
                            <p className="text-body-sm text-on-surface-variant">
                              {row.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                        {row.customer}
                      </td>
                      <td className="px-4 py-3 font-mono text-code-sm tabular-nums">
                        {formatInr(row.economics.costBasis)}
                      </td>
                      <td className="px-4 py-3 font-mono text-code-sm tabular-nums">
                        {formatInr(row.economics.unitPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-code-sm font-semibold tabular-nums text-primary">
                          {formatInr(rescuePrice)}
                        </span>
                        <p className="mt-0.5 text-[11px] text-on-surface-variant">
                          for {goal.toFixed(1)}% margin
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <AnimatedNumber
                          value={margin}
                          format={fmtMargin}
                          className="text-code-md font-semibold text-error"
                        />
                        <p className="mt-0.5 text-[11px] text-on-surface-variant">
                          {row.reason === "underwater"
                            ? "Quote underwater"
                            : "Below goal"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip
                          status={
                            row.reason === "underwater"
                              ? "On Hold"
                              : row.status
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {row.reason === "below_goal" ? (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                acceptBelowGoal({
                                  quotationId: row.economics.quotationId,
                                  partId: row.partId,
                                  acceptedAt: new Date().toISOString(),
                                  goalPct: goal,
                                  marginPct: margin,
                                });
                                markStory("urgent_act");
                                setTick((t) => t + 1);
                              }}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                              Accept below goal
                            </Button>
                          ) : null}
                          <Button
                            variant="secondary"
                            onClick={() =>
                              setRescue({ row, mode: "all" })
                            }
                          >
                            <FilePlus2 className="h-3.5 w-3.5" />
                            New quotes (all)
                          </Button>
                          <Link
                            href={`/parts/${row.partId}`}
                            className="press inline-flex items-center gap-1 text-body-sm font-medium text-primary hover:underline"
                          >
                            Open <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
