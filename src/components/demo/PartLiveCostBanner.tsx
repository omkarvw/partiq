"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { QuoteMarginBanner } from "@/components/demo/QuoteMarginBanner";
import { formatInr } from "@/lib/costing";
import { getQuotationsForPart } from "@/lib/data";
import {
  computePartEconomics,
  computeQuoteEconomics,
} from "@/lib/factory/selectors";

export function PartLiveCostBanner({ partId }: { partId: string }) {
  const { breakups, record } = useV2Graph();
  const grades = record.materialGrades ?? [];
  const eco = useMemo(
    () => computePartEconomics(partId, breakups, record.machines, grades),
    [partId, breakups, record.machines, grades],
  );
  const quotes = getQuotationsForPart(partId);
  const latest = [...quotes].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];
  const qEco = useMemo(
    () =>
      latest
        ? computeQuoteEconomics(
            latest.id,
            breakups,
            record.machines,
            grades,
          )
        : null,
    [latest, breakups, record.machines, grades],
  );

  if (!eco) return null;

  return (
    <div className="mb-6 space-y-3">
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="label-caps text-primary">Live part cost</p>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Process{" "}
          <span className="font-mono tabular-nums text-on-surface">
            {formatInr(eco.estCost)}
          </span>
          {" · "}
          Material{" "}
          <span className="font-mono tabular-nums text-on-surface">
            {formatInr(eco.materialCost)}
          </span>
          {" · "}
          <span className="font-medium text-on-surface">Total </span>
          <span className="font-mono tabular-nums font-medium text-on-surface">
            {formatInr(eco.totalCost)}
          </span>
          {" · Act process "}
          <span className="font-mono tabular-nums text-on-surface">
            {formatInr(eco.actCost)}
          </span>
        </p>
        <p className="mt-1 text-[11px] text-on-surface-variant">
          Process uses Cash MHR from Factory. Material uses grade rates — change
          rates in{" "}
          <Link href="/master-data/materials" className="text-primary hover:underline">
            Master data
          </Link>
          .
        </p>
      </div>
      {latest && qEco ? (
        <QuoteMarginBanner
          economics={qEco}
          quoteNumber={latest.quoteNumber}
          quoteHref={`/parts/${partId}/quotations/${latest.id}`}
        />
      ) : null}
    </div>
  );
}
