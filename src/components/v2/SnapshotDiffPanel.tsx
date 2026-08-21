"use client";

import { useMemo } from "react";
import { ImpactCascade } from "@/components/demo/ImpactCascade";
import {
  compareSnapshots,
  sectionLabel,
} from "@/lib/v2/snapshotDiff";
import type { V2BaselineSnapshot } from "@/lib/v2/clientDb";
import { formatInr } from "@/lib/costing";

export function SnapshotDiffPanel({
  reference,
  target,
  referenceLabel = "Reference",
  targetLabel = "This version",
}: {
  reference: V2BaselineSnapshot;
  target: V2BaselineSnapshot;
  referenceLabel?: string;
  targetLabel?: string;
}) {
  const compare = useMemo(
    () => compareSnapshots(reference, target),
    [reference, target],
  );

  if (compare.sectionCount === 0) {
    return (
      <p className="mt-3 text-body-sm text-on-surface-variant">
        No differences vs {referenceLabel.toLowerCase()}.
      </p>
    );
  }

  const blendedDelta =
    compare.targetBlendedMhr - compare.referenceBlendedMhr;

  return (
    <div className="mt-4 space-y-4 border-t border-outline-variant pt-4">
      <div>
        <p className="label-caps text-on-surface-variant">
          What changed · {compare.sectionCount} section
          {compare.sectionCount === 1 ? "" : "s"}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {compare.changedSections.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-code-sm text-amber-800"
            >
              <span className="impact-dirty-light" aria-hidden />
              {sectionLabel(id)}
            </span>
          ))}
        </div>
        <ul className="mt-3 space-y-1.5 text-body-sm text-on-surface">
          {compare.changeLines.slice(0, 12).map((line, i) => (
            <li key={`${line.section}-${i}`} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{line.label}</span>
            </li>
          ))}
          {compare.changeLines.length > 12 ? (
            <li className="text-on-surface-variant">
              +{compare.changeLines.length - 12} more detail lines
            </li>
          ) : null}
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-surface-low/60 px-3 py-2">
          <p className="text-code-sm text-on-surface-variant">
            Plant blended Cash MHR
          </p>
          <p className="font-mono text-body-md text-on-surface">
            {formatInr(compare.referenceBlendedMhr)} →{" "}
            {formatInr(compare.targetBlendedMhr)}
            <span className="ml-2 text-body-sm text-on-surface-variant">
              ({blendedDelta > 0 ? "+" : ""}
              {formatInr(blendedDelta)}/hr)
            </span>
          </p>
          <p className="mt-0.5 text-code-sm text-on-surface-variant">
            {referenceLabel} → {targetLabel}
          </p>
        </div>
        <div className="rounded-lg bg-surface-low/60 px-3 py-2">
          <p className="text-code-sm text-on-surface-variant">
            Plant capacity hours / yr
          </p>
          <p className="font-mono text-body-md text-on-surface">
            {Math.round(compare.referenceCapacityHours).toLocaleString("en-IN")}{" "}
            →{" "}
            {Math.round(compare.targetCapacityHours).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {compare.cascade.length > 0 && compare.focusMachineName ? (
        <div>
          <p className="mb-2 text-body-sm text-on-surface-variant">
            Cost cascade · {compare.focusMachineName}
          </p>
          <div className="rounded-xl border border-outline-variant bg-surface-lowest p-3">
            <p className="mb-2 text-body-sm text-on-surface-variant">
              Tap a row to open that section in Master data.
            </p>
            <ImpactCascade steps={compare.cascade} linkToImpact />
          </div>
        </div>
      ) : null}
    </div>
  );
}
