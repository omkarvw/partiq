"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { History, Plus, Save, Trash2, Upload } from "lucide-react";
import { getProcess } from "@/lib/data";
import { calcCost, formatInr, timeUnitLabel, variancePct } from "@/lib/costing";
import type { CustomField, TimeUnit } from "@/lib/types";
import {
  Breadcrumbs,
  Button,
  Panel,
  VarianceChip,
} from "@/components/ui/Primitives";

export default function ProcessEntryPage() {
  const params = useParams<{ partId: string; processId: string }>();
  const found = getProcess(params.partId, params.processId);

  const initial = useMemo(() => {
    if (!found) return null;
    const current =
      found.process.versions.find(
        (v) => v.versionNumber === found.process.currentVersion,
      ) ?? found.process.versions[0];
    return current;
  }, [found]);

  const [version, setVersion] = useState(found?.process.currentVersion ?? 1);
  const [mhr, setMhr] = useState(initial?.mhr ?? 0);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>(initial?.timeUnit ?? "minutes");
  const [est, setEst] = useState(initial?.timeEstimated ?? 0);
  const [act, setAct] = useState(initial?.timeActual ?? 0);
  const [fields, setFields] = useState<CustomField[]>(initial?.customFields ?? []);

  if (!found || !initial) {
    return <div className="p-8 text-body-md">Process not found.</div>;
  }

  const { part, process } = found;
  const selected =
    process.versions.find((v) => v.versionNumber === version) ?? initial;

  const estCost = calcCost(mhr, est, timeUnit);
  const actCost = calcCost(mhr, act, timeUnit);
  const costVar = variancePct(estCost, actCost);
  const timeVar = variancePct(est, act);
  const unitShort = timeUnitLabel(timeUnit);

  function applyVersion(n: number) {
    const v = process.versions.find((x) => x.versionNumber === n);
    if (!v) return;
    setVersion(n);
    setMhr(v.mhr);
    setTimeUnit(v.timeUnit);
    setEst(v.timeEstimated);
    setAct(v.timeActual);
    setFields(v.customFields.map((f) => ({ ...f })));
  }

  function changeTimeUnit(next: TimeUnit) {
    if (next === timeUnit) return;
    const factor = next === "seconds" ? 60 : 1 / 60;
    setEst((prev) => Math.round(prev * factor * 1000) / 1000);
    setAct((prev) => Math.round(prev * factor * 1000) / 1000);
    setTimeUnit(next);
  }

  return (
    <div className="pb-28">
      <div className="p-8">
        <Breadcrumbs
          items={[
            { label: "Parts", href: "/parts" },
            { label: part.code, href: `/parts/${part.id}` },
            { label: process.name.split(" - ")[0] },
          ]}
        />

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-headline-lg text-on-surface">Process: {process.name}</h2>
            <p className="mt-1 max-w-2xl text-body-sm text-on-surface-variant">
              {process.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded border border-outline-variant bg-surface-lowest">
              {process.versions.map((v) => (
                <button
                  key={v.versionNumber}
                  type="button"
                  onClick={() => applyVersion(v.versionNumber)}
                  className={`cursor-pointer border-r border-outline-variant px-3 py-1.5 font-mono text-code-sm last:border-r-0 ${
                    version === v.versionNumber
                      ? "bg-primary/5 font-bold text-primary"
                      : "text-on-surface hover:bg-surface-high"
                  }`}
                >
                  v{v.versionNumber}
                  {v.status === "current" ? " ·" : ""}
                </button>
              ))}
            </div>
            <Link href={`/parts/${part.id}/processes/${process.id}/versions`}>
              <Button variant="secondary">
                <History className="h-4 w-4" />
                Version history
              </Button>
            </Link>
            <Link href={`/parts/${part.id}/processes/${process.id}/viewer`}>
              <Button variant="secondary">Open viewer</Button>
            </Link>
            <Link href={`/parts/${part.id}/processes/${process.id}/audit`}>
              <Button variant="ghost">Audit</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Panel title="Metrics">
              <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2">
                <div className="space-y-3">
                  <MetricInput
                    label="MHR (₹/hr)"
                    value={mhr}
                    onChange={setMhr}
                  />
                  <div className="flex items-center">
                    <label className="label-caps w-36 shrink-0 pr-4 text-right text-on-surface-variant">
                      Time unit
                    </label>
                    <select
                      value={timeUnit}
                      onChange={(e) => changeTimeUnit(e.target.value as TimeUnit)}
                      className="flex-1 cursor-pointer rounded-sm border border-outline-variant bg-surface px-3 py-1.5 font-mono text-code-md focus:border-primary"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="seconds">Seconds</option>
                    </select>
                  </div>
                  <MetricInput
                    label={`Est. Time (${unitShort})`}
                    value={est}
                    onChange={setEst}
                  />
                  <MetricInput
                    label={`Act. Time (${unitShort})`}
                    value={act}
                    onChange={setAct}
                  />
                  <p className="pl-36 text-[11px] text-on-surface-variant">
                    Cost = MHR × time in hours (
                    {timeUnit === "minutes" ? "÷ 60" : "÷ 3600"}).
                  </p>
                </div>
                <div className="flex flex-col justify-center rounded border border-outline-variant bg-surface-low p-4">
                  <h4 className="label-caps mb-3 text-on-surface-variant">
                    Calculated Costs
                  </h4>
                  <div className="mb-2 flex justify-between">
                    <span className="text-body-sm text-on-surface-variant">Est. Cost</span>
                    <span className="font-mono text-code-md">{formatInr(estCost)}</span>
                  </div>
                  <div className="mb-3 flex justify-between border-b border-outline-variant/50 pb-3">
                    <span className="text-body-sm text-on-surface-variant">Act. Cost</span>
                    <span className="font-mono text-code-md">{formatInr(actCost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-on-surface-variant">Cost variance</span>
                    <VarianceChip pct={costVar} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-body-sm text-on-surface-variant">Time variance</span>
                    <VarianceChip pct={timeVar} />
                  </div>
                </div>
              </div>
            </Panel>

            <Panel
              title="Custom Fields"
              action={
                <button
                  type="button"
                  onClick={() =>
                    setFields((prev) => [
                      ...prev,
                      { id: `new-${Date.now()}`, label: "", value: "" },
                    ])
                  }
                  className="inline-flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-body-sm font-medium text-primary transition-colors hover:bg-surface-container"
                >
                  <Plus className="h-[18px] w-[18px]" />
                  Add Field
                </button>
              }
            >
              <div className="space-y-2 p-4">
                {fields.length === 0 && (
                  <p className="text-body-sm text-on-surface-variant">
                    No custom fields. Click Add Field to create label / value pairs.
                  </p>
                )}
                {fields.map((f) => (
                  <div key={f.id} className="group flex items-center gap-2">
                    <input
                      value={f.label}
                      onChange={(e) =>
                        setFields((prev) =>
                          prev.map((x) =>
                            x.id === f.id ? { ...x, label: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="Label"
                      className="w-1/3 rounded-sm border border-outline-variant bg-surface px-3 py-1.5 text-body-sm text-on-surface-variant focus:border-primary"
                    />
                    <input
                      value={f.value}
                      onChange={(e) =>
                        setFields((prev) =>
                          prev.map((x) =>
                            x.id === f.id ? { ...x, value: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="Value"
                      className="flex-1 rounded-sm border border-outline-variant bg-surface px-3 py-1.5 text-body-sm focus:border-primary"
                    />
                    <button
                      type="button"
                      aria-label="Delete field"
                      onClick={() =>
                        setFields((prev) => prev.filter((x) => x.id !== f.id))
                      }
                      className="cursor-pointer rounded p-1.5 text-outline opacity-0 transition-opacity hover:text-error group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel title="Process Files">
            <div className="flex h-full flex-col p-4">
              <div className="mb-4 cursor-pointer rounded-lg border-2 border-dashed border-outline-variant p-4 text-center transition-colors hover:border-primary/50 hover:bg-surface-low">
                <Upload className="mx-auto mb-2 h-8 w-8 text-outline" />
                <p className="text-body-sm text-on-surface-variant">
                  Drag files here or <span className="font-medium text-primary">browse</span>
                </p>
                <p className="label-caps mt-1 text-outline">.nc, .gcode, .P-2, .pdf</p>
              </div>
              <h4 className="label-caps mb-2 text-on-surface-variant">
                Attached · v{selected.versionNumber}
              </h4>
              <div className="space-y-2">
                {selected.files.map((f) => (
                  <Link
                    key={f.id}
                    href={`/parts/${part.id}/processes/${process.id}/viewer?file=${f.id}`}
                    className="flex cursor-pointer items-center justify-between rounded border border-outline-variant bg-surface p-2 transition-colors hover:border-primary/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-code-sm text-on-surface">
                        {f.name}
                      </p>
                      <p className="label-caps text-[9px] text-on-surface-variant">
                        {f.sizeLabel} · {f.uploadedAt}
                      </p>
                    </div>
                  </Link>
                ))}
                {selected.files.length === 0 && (
                  <p className="text-body-sm text-on-surface-variant">No files on this version.</p>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="fixed bottom-0 left-sidebar right-0 z-30 flex justify-end gap-3 border-t border-outline-variant bg-surface-lowest px-8 py-3 shadow-sticky">
        <Link href={`/parts/${part.id}`}>
          <Button variant="ghost">Cancel</Button>
        </Link>
        <Button variant="secondary">Publish new version</Button>
        <Button>
          <Save className="h-[18px] w-[18px]" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function MetricInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center">
      <label className="label-caps w-36 shrink-0 pr-4 text-right text-on-surface-variant">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 rounded-sm border border-outline-variant bg-surface px-3 py-1.5 font-mono text-code-md focus:border-primary"
      />
    </div>
  );
}
