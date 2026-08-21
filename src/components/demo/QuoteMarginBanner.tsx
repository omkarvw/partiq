"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, FilePlus2 } from "lucide-react";
import { formatInr } from "@/lib/costing";
import type { QuoteEconomics } from "@/lib/factory/types";
import { Button, StatusChip } from "@/components/ui/Primitives";
import { RescueQuoteModal } from "@/components/commercial/RescueQuoteModal";
import { useV2Graph } from "@/components/v2/V2GraphProvider";

export function QuoteMarginBanner({
  economics,
  quoteHref,
  quoteNumber,
  allowRescue = true,
}: {
  economics: QuoteEconomics;
  quoteHref: string;
  quoteNumber: string;
  allowRescue?: boolean;
}) {
  const { record } = useV2Graph();
  const goal = record.plant.targetGrossMarginPct ?? 20;
  const [open, setOpen] = useState(false);

  const belowGoal =
    economics.grossMarginPct != null && economics.grossMarginPct < goal;
  const needsRescue = economics.underwater || belowGoal;

  const tone = economics.underwater
    ? "border-error/40 bg-error-container/50"
    : belowGoal
      ? "border-error/20 bg-error-container/30"
      : "border-primary/20 bg-primary/5";

  return (
    <>
      <div className={`rounded border px-4 py-3 ${tone}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                needsRescue ? "text-error" : "text-primary"
              }`}
            />
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="text-body-sm font-medium text-on-surface">
                  Live cost vs {quoteNumber}
                </p>
                <StatusChip
                  status={economics.underwater ? "On Hold" : "In Production"}
                />
              </div>
              <p className="text-body-sm text-on-surface-variant">
                Part cost {formatInr(economics.costBasis)}
                {economics.materialCost > 0
                  ? ` (process ${formatInr(economics.processCost)} + material ${formatInr(economics.materialCost)})`
                  : ""}{" "}
                · Unit price {formatInr(economics.unitPrice)} · Gross margin{" "}
                <span className="font-mono tabular-nums text-on-surface">
                  {economics.grossMarginPct == null
                    ? "—"
                    : `${economics.grossMarginPct.toFixed(1)}%`}
                </span>
                {economics.underwater
                  ? " — quote is underwater"
                  : belowGoal
                    ? ` — below ${goal.toFixed(1)}% goal`
                    : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {allowRescue && needsRescue ? (
              <Button variant="secondary" onClick={() => setOpen(true)}>
                <FilePlus2 className="h-3.5 w-3.5" />
                New quote at {goal.toFixed(0)}%
              </Button>
            ) : null}
            <Link
              href={quoteHref}
              className="inline-flex cursor-pointer items-center gap-1 text-body-sm font-medium text-primary hover:underline"
            >
              Open quote <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
      {open ? (
        <RescueQuoteModal
          open
          onClose={() => setOpen(false)}
          partId={economics.partId}
          costBasis={economics.costBasis}
          currentUnitPrice={economics.unitPrice}
          targetGrossMarginPct={goal}
        />
      ) : null}
    </>
  );
}
