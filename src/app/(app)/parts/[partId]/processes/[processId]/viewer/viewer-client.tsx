"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Copy, Download, Maximize2, Upload } from "lucide-react";
import { getCurrentVersion, getProcess } from "@/lib/data";
import { calcCost, formatInr, formatTime, variancePct } from "@/lib/costing";
import { Button, VarianceChip } from "@/components/ui/Primitives";

export default function ProgramViewerPage() {
  const params = useParams<{ partId: string; processId: string }>();
  const search = useSearchParams();
  const found = getProcess(params.partId, params.processId);

  const processCurrent = found ? getCurrentVersion(found.process) : null;
  const fileId = search.get("file");
  const initialFile = processCurrent
    ? (processCurrent.files.find((f) => f.id === fileId) ??
      processCurrent.files.find((f) => f.kind === "gcode") ??
      processCurrent.files[0])
    : undefined;

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const activeId = selectedId ?? initialFile?.id;
  const selected = useMemo(
    () => processCurrent?.files.find((f) => f.id === activeId) ?? initialFile,
    [processCurrent, activeId, initialFile],
  );

  if (!found || !processCurrent) {
    return <div className="p-8">Process not found.</div>;
  }

  const { part, process } = found;
  const current = processCurrent;
  const estCost = calcCost(current.mhr, current.timeEstimated, current.timeUnit);
  const actCost = calcCost(current.mhr, current.timeActual, current.timeUnit);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-4">
        <div>
          <Link
            href={`/parts/${part.id}/processes/${process.id}`}
            className="mb-1 inline-flex cursor-pointer items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            {part.code}
          </Link>
          <h2 className="flex items-center gap-3 text-headline-lg font-bold text-on-surface">
            {process.name}
            <span className="rounded border border-primary-container/20 bg-primary-container/10 px-2 py-0.5 font-sans text-label-caps uppercase tracking-wider text-primary-container">
              Active
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded border border-outline-variant bg-surface-lowest">
            {process.versions.map((v) => (
              <span
                key={v.versionNumber}
                className={`border-r border-outline-variant px-3 py-1.5 font-mono text-code-sm last:border-r-0 ${
                  v.versionNumber === process.currentVersion
                    ? "bg-primary/5 font-bold text-primary"
                    : "text-on-surface-variant"
                }`}
              >
                v{v.versionNumber}
              </span>
            ))}
          </div>
          <Button variant="secondary">Publish new version</Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <div className="rounded border border-outline-variant bg-surface-lowest p-4 shadow-industrial">
            <h3 className="mb-4 border-b border-outline-variant/50 pb-2 text-headline-sm text-on-surface">
              Execution Metrics
            </h3>
            <dl className="space-y-3">
              <Row label="MHR (Rate)" value={`${formatInr(current.mhr)}/hr`} />
              <Row label="Est Time" value={formatTime(current.timeEstimated, current.timeUnit)} />
              <Row label="Act Time" value={formatTime(current.timeActual, current.timeUnit)} />
              <Row label="Est Cost" value={formatInr(estCost)} />
              <Row label="Act Cost" value={formatInr(actCost)} />
              <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
                <span className="text-body-sm text-on-surface-variant">Variance</span>
                <VarianceChip
                  pct={variancePct(current.timeEstimated, current.timeActual)}
                />
              </div>
            </dl>
          </div>

          <div className="rounded border border-outline-variant bg-surface-lowest shadow-industrial">
            <div className="border-b border-outline-variant/50 px-4 py-3">
              <h3 className="text-headline-sm text-on-surface">Custom Fields</h3>
            </div>
            <div className="space-y-3 p-4">
              {current.customFields.map((f) => (
                <div key={f.id}>
                  <span className="label-caps mb-1 block text-on-surface-variant">
                    {f.label}
                  </span>
                  <span className="inline-block w-full rounded border border-outline-variant/50 bg-surface-bright px-2 py-1 font-mono text-code-md">
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex h-[560px] flex-col overflow-hidden rounded border border-outline-variant bg-inverse-surface shadow-industrial lg:col-span-6 lg:h-auto">
          <div className="flex h-10 items-center justify-between border-b border-[#2d3b4f] bg-[#1a232f] px-3">
            <div className="flex items-center gap-2 border-t-2 border-primary-fixed bg-[#0d1520] px-4 py-2 font-mono text-code-md text-primary-fixed">
              {selected?.name ?? "No file"}
              <span className="rounded bg-primary/20 px-1 text-[10px]">
                v{process.currentVersion}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <IconBtn label="Copy">
                <Copy className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="Download">
                <Download className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="Fullscreen">
                <Maximize2 className="h-4 w-4" />
              </IconBtn>
            </div>
          </div>
          <pre className="flex-1 overflow-auto bg-[#0d1520] p-4 font-mono text-code-md leading-relaxed text-[#c6c6c9] selection:bg-primary-container/40">
            <code>{selected?.content ?? "// No previewable content for this file"}</code>
          </pre>
        </div>

        <div className="lg:col-span-3">
          <div className="flex h-full flex-col rounded border border-outline-variant bg-surface-lowest shadow-industrial">
            <div className="flex items-center justify-between border-b border-outline-variant/50 p-4">
              <h3 className="text-headline-sm text-on-surface">Process Files</h3>
              <span className="rounded bg-surface-variant px-2 py-0.5 font-mono text-label-caps text-on-surface-variant">
                {current.files.length} Files
              </span>
            </div>
            <div className="flex-1 space-y-1 overflow-auto p-2">
              {current.files.map((f) => {
                const active = f.id === selected?.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedId(f.id)}
                    className={`flex w-full cursor-pointer items-start gap-3 rounded border p-2 text-left transition-colors ${
                      active
                        ? "border-primary/20 bg-primary/5"
                        : "border-transparent hover:bg-surface-high/40"
                    }`}
                  >
                    <div className="min-w-0">
                      <p
                        className={`truncate font-mono text-code-md ${
                          active ? "font-bold text-primary" : "text-on-surface"
                        }`}
                      >
                        {f.name}
                      </p>
                      <p className="mt-0.5 text-[12px] text-on-surface-variant">
                        {f.kind === "gcode" ? "G-Code" : f.kind.toUpperCase()} · {f.sizeLabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-outline-variant/50 p-4">
              <div className="cursor-pointer rounded-lg border-2 border-dashed border-outline-variant/60 p-6 text-center hover:border-primary/50 hover:bg-surface-high/20">
                <Upload className="mx-auto mb-2 h-5 w-5 text-on-surface-variant" />
                <p className="text-body-sm font-semibold text-on-surface">Upload new file</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-end justify-between border-b border-outline-variant/30 pb-2 last:border-0">
      <span className="text-body-sm text-on-surface-variant">{label}</span>
      <span className="font-mono text-code-md text-on-surface">{value}</span>
    </div>
  );
}

function IconBtn({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="cursor-pointer rounded p-1.5 text-secondary-fixed-dim transition-colors hover:bg-[#2d3b4f] hover:text-white"
    >
      {children}
    </button>
  );
}
