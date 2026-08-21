"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { formatInr } from "@/lib/costing";
import { listPartCostDeltas } from "@/lib/factory/selectors";

/** Named parts whose total cost moves when Master data material rates change. */
export function PartCostImpactPanel() {
  const { breakups, record } = useV2Graph();
  const { moneyDirty, draft, baselineSnap } = useImpactDraft();

  const rows = useMemo(() => {
    if (!moneyDirty.materials) return [];
    return listPartCostDeltas(
      breakups,
      record.machines,
      baselineSnap.materialGrades ?? [],
      draft.materialGrades ?? [],
    );
  }, [
    moneyDirty.materials,
    breakups,
    record.machines,
    baselineSnap.materialGrades,
    draft.materialGrades,
  ]);

  const gradeChanges = useMemo(() => {
    if (!moneyDirty.materials) return [];
    const live = new Map(
      (baselineSnap.materialGrades ?? []).map((g) => [g.id, g]),
    );
    const lines: string[] = [];
    for (const g of draft.materialGrades ?? []) {
      const prev = live.get(g.id);
      if (!prev) {
        lines.push(`Added ${g.name}`);
        continue;
      }
      if (
        prev.rawRatePerKg !== g.rawRatePerKg ||
        prev.scrapRatePerKg !== g.scrapRatePerKg
      ) {
        lines.push(
          `${g.name}: raw ${formatInr(prev.rawRatePerKg)} → ${formatInr(g.rawRatePerKg)}/kg`,
        );
      }
    }
    return lines;
  }, [moneyDirty.materials, baselineSnap.materialGrades, draft.materialGrades]);

  if (!moneyDirty.materials) return null;

  const liveSum = rows.reduce((s, r) => s + r.liveTotal, 0);
  const draftSum = rows.reduce((s, r) => s + r.draftTotal, 0);
  const deltaSum = draftSum - liveSum;

  return (
    <div
      id="part-cost-impact"
      className="scroll-mt-24 rounded-xl border border-amber-500/40 bg-amber-500/5 p-5"
    >
      <h3 className="text-headline-sm text-on-surface">Part cost impact</h3>
      <p className="mt-0.5 text-[11.5px] text-on-surface-variant">
        Material rates do not change Cash MHR — they move part and quote cost.
      </p>

      {gradeChanges.length > 0 ? (
        <ul className="mt-3 space-y-1 text-body-sm text-on-surface-variant">
          {gradeChanges.slice(0, 6).map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-700" />
              {line}
            </li>
          ))}
        </ul>
      ) : null}

      {rows.length === 0 ? (
        <p className="mt-4 text-body-sm text-on-surface-variant">
          No linked parts yet. Attach a grade and weights on a{" "}
          <Link href="/parts" className="font-medium text-primary hover:underline">
            part
          </Link>
          , then rate changes will list here.
        </p>
      ) : (
        <>
          <p className="mt-4 text-body-sm text-on-surface">
            <span className="font-medium">{rows.length}</span> part
            {rows.length === 1 ? "" : "s"} · total{" "}
            <span className="font-mono tabular-nums">
              {formatInr(liveSum)} → {formatInr(draftSum)}
            </span>
            {Math.abs(deltaSum) >= 0.01 ? (
              <span className="font-mono tabular-nums text-on-surface-variant">
                {" "}
                ({deltaSum > 0 ? "+" : ""}
                {formatInr(deltaSum)})
              </span>
            ) : null}
          </p>
          <ul className="mt-3 divide-y divide-outline-variant overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest">
            {rows.map((row) => (
              <li key={row.partId}>
                <Link
                  href={`/parts/${row.partId}?from=master-data`}
                  className="flex flex-wrap items-baseline justify-between gap-2 px-3.5 py-3 hover:bg-surface-low"
                >
                  <div className="min-w-0">
                    <p className="truncate text-body-sm font-medium text-on-surface">
                      <span className="font-mono text-on-surface-variant">
                        {row.code}
                      </span>
                      {" · "}
                      {row.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-on-surface-variant">
                      {row.gradeName}
                      {" · material "}
                      <span className="font-mono tabular-nums">
                        {formatInr(row.liveMaterial)} →{" "}
                        {formatInr(row.draftMaterial)}
                      </span>
                      <span className="ml-1.5 text-amber-800">
                        · open to look — then come back
                      </span>
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-body-sm tabular-nums text-on-surface">
                    {formatInr(row.liveTotal)} → {formatInr(row.draftTotal)}
                    <span className="ml-1.5 text-on-surface-variant">
                      ({row.delta > 0 ? "+" : ""}
                      {formatInr(row.delta)})
                    </span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
