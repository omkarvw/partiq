import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Filter } from "lucide-react";
import { auditEvents, getProcess } from "@/lib/data";
import { Breadcrumbs, Button, Panel } from "@/components/ui/Primitives";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ partId: string; processId: string }>;
}) {
  const { partId, processId } = await params;
  const found = getProcess(partId, processId);
  if (!found) notFound();
  const { part, process } = found;

  return (
    <div className="p-8">
      <Breadcrumbs
        items={[
          { label: "Parts", href: "/parts" },
          { label: part.code, href: `/parts/${part.id}` },
          {
            label: process.name.split(" - ")[0],
            href: `/parts/${part.id}/processes/${process.id}`,
          },
          { label: "Audit" },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg text-on-surface">Process Audit</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Timeline of changes for {process.name} on {part.code}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="secondary">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Panel>
        <div className="label-caps flex border-b border-outline-variant bg-surface-bright/50 px-4 py-2 text-on-surface-variant">
          <div className="w-32 shrink-0">Timestamp</div>
          <div className="w-44 shrink-0">Actor</div>
          <div className="w-28 shrink-0">Event</div>
          <div className="flex-1">Details</div>
        </div>
        <div className="flex flex-col">
          {auditEvents.map((e) => (
            <div
              key={e.id}
              className="flex border-b border-outline-variant px-4 py-2.5 transition-colors last:border-b-0 hover:bg-surface-bright"
            >
              <div className="w-32 shrink-0 font-mono text-code-md text-tertiary">
                [{e.timestamp}]
                {e.dayLabel && (
                  <div className="text-[10px] text-outline">{e.dayLabel}</div>
                )}
              </div>
              <div className="flex w-44 shrink-0 items-center gap-2 text-body-md text-on-surface">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-[8px] font-bold text-on-primary">
                  {e.actor.charAt(0)}
                </span>
                {e.actor}
              </div>
              <div className="w-28 shrink-0">
                <EventBadge type={e.eventType} />
              </div>
              <div className="flex-1 font-mono text-code-md text-on-surface">
                {e.details}
                {e.entityLabel && (
                  <span className="ml-2 text-outline">· {e.entityLabel}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between bg-surface-bright/20 px-4 py-2">
          <span className="font-mono text-code-sm text-on-surface-variant">
            Showing {auditEvents.length} events (demo)
          </span>
          <Link
            href={`/parts/${part.id}/processes/${process.id}`}
            className="text-body-sm text-primary hover:underline"
          >
            Back to process
          </Link>
        </div>
      </Panel>
    </div>
  );
}

function EventBadge({ type }: { type: string }) {
  const tone =
    type === "VARIANCE"
      ? "bg-error-container/30 text-error"
      : type === "PUBLISH"
        ? "bg-surface-variant text-on-surface"
        : "bg-surface-high text-primary";
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 font-mono text-label-caps ${tone}`}
    >
      {type}
    </span>
  );
}
