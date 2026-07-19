import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, FolderOpen, Handshake, Plus } from "lucide-react";
import { getCommercialSummaryForPart, getCurrentVersion, getPart } from "@/lib/data";
import { calcCost, formatDurationSeconds, formatInr, formatTime, toSeconds, variancePct } from "@/lib/costing";
import {
  Breadcrumbs,
  Button,
  Panel,
  StatusChip,
  VarianceChip,
} from "@/components/ui/Primitives";

export default async function PartDetailPage({
  params,
}: {
  params: Promise<{ partId: string }>;
}) {
  const { partId } = await params;
  const part = getPart(partId);
  if (!part) notFound();

  const commercial = getCommercialSummaryForPart(part.id);
  const byDateDesc = <T extends { createdAt?: string; respondedAt?: string }>(
    a: T,
    b: T,
  ) => {
    const da = a.createdAt ?? a.respondedAt ?? "";
    const db = b.createdAt ?? b.respondedAt ?? "";
    return db.localeCompare(da);
  };
  const latestEnquiry = [...commercial.enquiries].sort(byDateDesc)[0];
  const latestQuote = [...commercial.quotations].sort(byDateDesc)[0];
  const latestResponse = [...commercial.responses].sort(byDateDesc)[0];

  let estTotalSec = 0;
  let actTotalSec = 0;
  part.processes.forEach((p) => {
    const v = getCurrentVersion(p);
    estTotalSec += toSeconds(v.timeEstimated, v.timeUnit);
    actTotalSec += toSeconds(v.timeActual, v.timeUnit);
  });

  return (
    <div className="p-8">
      <Breadcrumbs items={[{ label: "Parts", href: "/parts" }, { label: part.code }]} />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-headline-lg text-on-surface">Part: {part.code}</h2>
          <p className="mt-1 max-w-2xl text-body-md text-secondary">{part.description}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/parts/${part.id}/commercial`}>
            <Button variant="secondary">
              <Handshake className="h-4 w-4" />
              Commercial
            </Button>
          </Link>
          <Link href={`/parts/${part.id}/files`}>
            <Button variant="secondary">
              <FolderOpen className="h-4 w-4" />
              Files hub
            </Button>
          </Link>
          <Button variant="secondary">Edit Details</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Process Sequence"
            action={
              <div className="label-caps flex gap-4 text-secondary">
                <span>
                  Est. Total:{" "}
                  <span className="ml-1 font-mono text-code-sm text-on-surface">
                    {formatDurationSeconds(estTotalSec)}
                  </span>
                </span>
                <span>
                  Act. Total:{" "}
                  <span className="ml-1 font-mono text-code-sm text-on-surface">
                    {formatDurationSeconds(actTotalSec)}
                  </span>
                </span>
              </div>
            }
          >
            {part.processes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-body-md text-on-surface-variant">No processes yet.</p>
                <Button className="mt-4" variant="secondary">
                  <Plus className="h-4 w-4" />
                  Add Process Step
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute bottom-0 left-[39px] top-0 w-0.5 bg-outline-variant/30" />
                {part.processes.map((proc) => {
                  const v = getCurrentVersion(proc);
                  const timeVar = variancePct(v.timeEstimated, v.timeActual);
                  return (
                    <Link
                      key={proc.id}
                      href={`/parts/${part.id}/processes/${proc.id}`}
                      className="relative z-10 flex cursor-pointer items-stretch border-b border-outline-variant/50 transition-colors last:border-b-0 hover:bg-surface-low/50"
                    >
                      <div className="flex w-20 shrink-0 justify-center pt-4">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-surface-lowest font-mono text-code-sm font-bold text-primary">
                          {proc.sequence}
                        </div>
                      </div>
                      <div className="flex flex-1 items-start justify-between gap-4 py-4 pr-4">
                        <div>
                          <h4 className="text-headline-sm text-on-surface">{proc.name}</h4>
                          <p className="mt-1 max-w-md text-body-sm text-secondary line-clamp-2">
                            {proc.description}
                          </p>
                          <p className="mt-2 font-mono text-code-sm text-on-surface-variant">
                            v{proc.currentVersion} current · MHR {formatInr(v.mhr)}/hr · Cost{" "}
                            {formatInr(calcCost(v.mhr, v.timeActual, v.timeUnit))} · unit{" "}
                            {v.timeUnit}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <span className="label-caps w-8 text-right text-secondary">EST</span>
                            <span className="rounded bg-surface-container px-2 py-1 font-mono text-code-md">
                              {formatTime(v.timeEstimated, v.timeUnit)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="label-caps w-8 text-right text-secondary">ACT</span>
                            <span className="rounded bg-primary/10 px-2 py-1 font-mono text-code-md text-primary">
                              {formatTime(v.timeActual, v.timeUnit)}
                            </span>
                          </div>
                          <VarianceChip pct={timeVar} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
                <div className="border-t border-outline-variant p-4">
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-outline py-2 text-body-md font-medium text-secondary transition-colors hover:border-primary hover:text-primary"
                  >
                    <Plus className="h-4 w-4" />
                    Add Process Step
                  </button>
                </div>
              </div>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Part Specifications">
            <SpecRow label="Material" value={part.material} />
            <div className="flex items-center border-b border-outline-variant/30 px-4 py-2">
              <div className="label-caps w-24 shrink-0 pr-4 text-right text-secondary">
                Customer
              </div>
              <Link
                href={`/customers/${part.customerId}`}
                className="flex-1 text-body-md text-primary hover:underline"
              >
                {part.customer}
              </Link>
            </div>
            <div className="flex items-center px-4 py-2">
              <div className="label-caps w-24 shrink-0 pr-4 text-right text-secondary">Status</div>
              <StatusChip status={part.status} />
            </div>
          </Panel>

          <Panel
            title="Commercial"
            action={
              <Link
                href={`/parts/${part.id}/commercial`}
                className="text-body-sm font-medium text-primary hover:underline"
              >
                Open hub
              </Link>
            }
          >
            <div className="grid grid-cols-3 gap-2 border-b border-outline-variant/50 px-4 py-3">
              <div className="text-center">
                <p className="font-mono text-headline-sm text-on-surface">
                  {commercial.enquiries.length}
                </p>
                <p className="label-caps text-on-surface-variant">RFQs</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-headline-sm text-on-surface">
                  {commercial.quotations.length}
                </p>
                <p className="label-caps text-on-surface-variant">Quotes</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-headline-sm text-on-surface">
                  {commercial.responses.length}
                </p>
                <p className="label-caps text-on-surface-variant">Replies</p>
              </div>
            </div>
            <div className="space-y-2 p-4 text-body-sm">
              {latestEnquiry ? (
                <p className="text-on-surface-variant">
                  Latest RFQ{" "}
                  <Link
                    href={`/parts/${part.id}/enquiries/${latestEnquiry.id}`}
                    className="font-mono text-primary hover:underline"
                  >
                    {latestEnquiry.reference}
                  </Link>{" "}
                  <StatusChip status={latestEnquiry.status} />
                </p>
              ) : (
                <p className="text-on-surface-variant">No enquiries yet.</p>
              )}
              {latestQuote ? (
                <p className="text-on-surface-variant">
                  Latest quote{" "}
                  <Link
                    href={`/parts/${part.id}/quotations/${latestQuote.id}`}
                    className="font-mono text-primary hover:underline"
                  >
                    {latestQuote.quoteNumber}
                  </Link>{" "}
                  <StatusChip status={latestQuote.status} />
                </p>
              ) : null}
              {latestResponse ? (
                <p className="text-on-surface-variant">
                  Latest reply{" "}
                  <Link
                    href={`/parts/${part.id}/responses/${latestResponse.id}`}
                    className="font-mono text-primary hover:underline"
                  >
                    {latestResponse.outcome}
                  </Link>
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel
            title="Part Files"
            action={
              <Link href={`/parts/${part.id}/files`} className="text-primary hover:underline">
                <FileText className="h-5 w-5" />
              </Link>
            }
          >
            <div className="space-y-1 p-2">
              {part.partFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded p-2 hover:bg-surface-container"
                >
                  <div>
                    <p className="font-mono text-code-md text-on-surface">{f.name}</p>
                    <p className="text-[11px] text-secondary">
                      {f.kind.toUpperCase()} · {f.sizeLabel}
                    </p>
                  </div>
                </div>
              ))}
              {part.partFiles.length === 0 && (
                <p className="p-3 text-body-sm text-on-surface-variant">No part-level documents.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center border-b border-outline-variant/30 px-4 py-2 last:border-b-0">
      <div className="label-caps w-24 shrink-0 pr-4 text-right text-secondary">{label}</div>
      <div className="flex-1 text-body-md text-on-surface">{value}</div>
    </div>
  );
}
