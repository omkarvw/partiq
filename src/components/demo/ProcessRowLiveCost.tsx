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
  const { resolveMhr, getMachine, resolveMachineId } = useV2Graph();
  const liveId = resolveMachineId(machineId);
  const machine = liveId ? getMachine(liveId) : undefined;
  const mhr = resolveMhr(fallbackMhr, machineId);
  const cost = calcCost(mhr, timeActual, timeUnit);
  return (
    <p className="mt-2 font-mono text-code-sm text-on-surface-variant">
      v{versionNumber} · {machine ? machine.name : "No factory machine"} · MHR{" "}
      {formatInr(mhr)}/hr · Cost {formatInr(cost)}
    </p>
  );
}
