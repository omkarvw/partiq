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
  const eco = useMemo(
    () => computeQuoteEconomics(quotationId, breakups, record.machines),
    [quotationId, breakups, record.machines],
  );
  if (!eco) return null;

  return (
    <div className="mb-6 space-y-4">
      <QuoteMarginBanner
        economics={eco}
        quoteNumber={quoteNumber}
        quoteHref={`/parts/${partId}/quotations/${quotationId}`}
      />
      <Panel title="Plant-linked margin">
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <div>
            <p className="label-caps text-on-surface-variant">Process cost</p>
            <p className="mt-1 font-mono text-headline-sm tabular-nums">
              {formatInr(eco.costBasis)}
            </p>
          </div>
          <div>
            <p className="label-caps text-on-surface-variant">Unit price</p>
            <p className="mt-1 font-mono text-headline-sm tabular-nums">
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
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Markup on cost{" "}
              {eco.markupPct == null ? "—" : `${eco.markupPct.toFixed(1)}%`}
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function CommercialLiveBanner({ partId }: { partId: string }) {
  const { breakups, record } = useV2Graph();
  const eco = useMemo(
    () => computePartEconomics(partId, breakups, record.machines),
    [partId, breakups, record.machines],
  );
  const quotes = getQuotationsForPart(partId);
  const focus =
    quotes.find((q) => q.status === "Sent") ??
    quotes.find((q) => q.status === "Draft") ??
    quotes[0];
  const qEco = useMemo(
    () =>
      focus
        ? computeQuoteEconomics(focus.id, breakups, record.machines)
        : null,
    [focus, breakups, record.machines],
  );

  if (!eco && !qEco) return null;

  return (
    <div className="mb-6 space-y-3">
      {eco ? (
        <div className="rounded border border-outline-variant bg-surface-low px-4 py-3 text-body-sm text-on-surface-variant">
          Current plant process cost for this part:{" "}
          <span className="font-mono tabular-nums text-on-surface">
            {formatInr(eco.estCost)}
          </span>
          . Quotation margins below use this live cost basis.
        </div>
      ) : null}
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
