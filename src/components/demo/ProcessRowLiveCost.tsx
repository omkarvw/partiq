"use client";

import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { calcCost, formatInr } from "@/lib/costing";

export function ProcessRowLiveCost({
  machineId,
  fallbackMhr,
  timeActual,
  timeUnit,
  versionNumber,
}: {
  machineId?: string;
  fallbackMhr: number;
  timeActual: number;
  timeUnit: "minutes" | "seconds";
  versionNumber: number;
}) {
  const { resolveMhr } = useV2Graph();
  const mhr = resolveMhr(fallbackMhr, machineId);
  const cost = calcCost(mhr, timeActual, timeUnit);
  return (
    <p className="mt-2 font-mono text-code-sm text-on-surface-variant">
      v{versionNumber} current · MHR {formatInr(mhr)}/hr
      {machineId ? " (from plant)" : ""} · Cost {formatInr(cost)} · unit{" "}
      {timeUnit}
    </p>
  );
}
