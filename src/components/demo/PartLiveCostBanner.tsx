"use client";

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
  const eco = useMemo(
    () => computePartEconomics(partId, breakups, record.machines),
    [partId, breakups, record.machines],
  );
  const quotes = getQuotationsForPart(partId);
  const latest = [...quotes].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];
  const qEco = useMemo(
    () =>
      latest
        ? computeQuoteEconomics(latest.id, breakups, record.machines)
        : null,
    [latest, breakups, record.machines],
  );

  if (!eco) return null;

  return (
    <div className="mb-6 space-y-3">
      <div className="rounded border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="label-caps text-primary">Live plant cost</p>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Est. process cost{" "}
          <span className="font-mono tabular-nums text-on-surface">
            {formatInr(eco.estCost)}
          </span>
          {" · "}
          Act.{" "}
          <span className="font-mono tabular-nums text-on-surface">
            {formatInr(eco.actCost)}
          </span>
          {" — MHR from factory setup / Impact"}
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
