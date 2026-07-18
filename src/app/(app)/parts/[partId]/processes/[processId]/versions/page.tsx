import Link from "next/link";
import { notFound } from "next/navigation";
import { getProcess } from "@/lib/data";
import { calcCost, formatInr, formatTime } from "@/lib/costing";
import { Breadcrumbs, Button, Panel } from "@/components/ui/Primitives";

export default async function VersionHistoryPage({
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
          { label: "Versions" },
        ]}
      />

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg text-on-surface">Process Version History</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Versions freeze metrics, custom fields, and G-code for {process.name}.
          </p>
        </div>
        <Link href={`/parts/${part.id}/processes/${process.id}`}>
          <Button variant="secondary">Back to process</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {[...process.versions].reverse().map((v) => (
          <Panel key={v.versionNumber}>
            <div className="flex flex-wrap items-start justify-between gap-4 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-headline-sm text-on-surface">
                    v{v.versionNumber}
                  </h3>
                  <span
                    className={`rounded-sm px-2 py-0.5 font-mono text-code-sm ${
                      v.status === "current"
                        ? "bg-primary/10 text-primary"
                        : v.status === "draft"
                          ? "bg-surface-high text-secondary"
                          : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
                <p className="mt-2 text-body-sm text-on-surface-variant">
                  {v.publishedBy
                    ? `Published by ${v.publishedBy} · ${v.publishedAt}`
                    : "Draft — not published"}
                </p>
                <p className="mt-2 font-mono text-code-sm text-on-surface">
                  MHR {formatInr(v.mhr)}/hr · Est {formatTime(v.timeEstimated, v.timeUnit)} · Act{" "}
                  {v.timeActual ? formatTime(v.timeActual, v.timeUnit) : "—"} · Cost{" "}
                  {formatInr(
                    calcCost(
                      v.mhr,
                      v.timeActual || v.timeEstimated,
                      v.timeUnit,
                    ),
                  )}{" "}
                  · {v.timeUnit}
                </p>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Files:{" "}
                  {v.files.length
                    ? v.files.map((f) => f.name).join(", ")
                    : "none"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/parts/${part.id}/processes/${process.id}`}>
                  <Button variant="secondary">View</Button>
                </Link>
                <Button variant="ghost">Compare</Button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
