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
import { Panel } from "@/components/ui/Primitives";

export function QuotationLiveEconomics({
  quotationId,
  quoteNumber,
  partId,
}: {
  quotationId: string;
  quoteNumber: string;
  partId: string;
}) {
  const { breakups, record } = useV2Graph();
  const grades = record.materialGrades ?? [];
  const eco = useMemo(
    () =>
      computeQuoteEconomics(quotationId, breakups, record.machines, grades),
    [quotationId, breakups, record.machines, grades],
  );
  if (!eco) return null;

  return (
    <div className="mb-6 space-y-4">
      <QuoteMarginBanner
        economics={eco}
        quoteNumber={quoteNumber}
        quoteHref={`/parts/${partId}/quotations/${quotationId}`}
      />
      <Panel title="Live cost vs quoted price">
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-5">
          <div>
            <p className="label-caps text-on-surface-variant">Process</p>
            <p className="mt-1 font-mono text-headline-sm tabular-nums">
              {formatInr(eco.processCost)}
            </p>
          </div>
          <div>
            <p className="label-caps text-on-surface-variant">Material</p>
            <p className="mt-1 font-mono text-headline-sm tabular-nums">
              {formatInr(eco.materialCost)}
            </p>
          </div>
          <div>
            <p className="label-caps text-on-surface-variant">Part cost</p>
            <p className="mt-1 font-mono text-headline-sm tabular-nums">
              {formatInr(eco.costBasis)}
            </p>
          </div>
          <div>
            <p className="label-caps text-on-surface-variant">Quoted price</p>
            <p className="mt-1 font-mono text-headline-sm tabular-nums text-primary">
              {formatInr(eco.unitPrice)}
            </p>
          </div>
          <div>
            <p className="label-caps text-on-surface-variant">Gross margin</p>
            <p className="mt-1 font-mono text-headline-sm tabular-nums">
              {eco.grossMarginPct == null
                ? "—"
                : `${eco.grossMarginPct.toFixed(1)}%`}
            </p>
            <p className="mt-1 text-[11px] text-on-surface-variant">
              vs live plant cost
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function CommercialLiveBanner({ partId }: { partId: string }) {
  const { breakups, record } = useV2Graph();
  const grades = record.materialGrades ?? [];
  const eco = useMemo(
    () => computePartEconomics(partId, breakups, record.machines, grades),
    [partId, breakups, record.machines, grades],
  );
  const quotes = getQuotationsForPart(partId);
  const focus =
    quotes.find((q) => q.status === "Sent") ??
    quotes.find((q) => q.status === "Draft") ??
    quotes[0];
  const qEco = useMemo(
    () =>
      focus
        ? computeQuoteEconomics(focus.id, breakups, record.machines, grades)
        : null,
    [focus, breakups, record.machines, grades],
  );

  if (!eco) return null;

  return (
    <div className="mb-6 space-y-3">
      <div className="rounded-lg border border-outline-variant bg-surface-lowest px-4 py-3">
        <p className="label-caps text-on-surface-variant">Live part cost</p>
        <p className="mt-1 font-mono text-body-md tabular-nums text-on-surface">
          Process {formatInr(eco.estCost)} · Material{" "}
          {formatInr(eco.materialCost)} · Total {formatInr(eco.totalCost)}
        </p>
      </div>
      {focus && qEco ? (
        <QuoteMarginBanner
          economics={qEco}
          quoteNumber={focus.quoteNumber}
          quoteHref={`/parts/${partId}/quotations/${focus.id}`}
        />
      ) : null}
    </div>
  );
}
