import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Eye, Upload } from "lucide-react";
import { getCurrentVersion, getPart } from "@/lib/data";
import { Breadcrumbs, Button, EmptyState, Panel } from "@/components/ui/Primitives";

export default async function PartFilesHubPage({
  params,
}: {
  params: Promise<{ partId: string }>;
}) {
  const { partId } = await params;
  const part = getPart(partId);
  if (!part) notFound();

  return (
    <div className="p-8">
      <Breadcrumbs
        items={[
          { label: "Parts", href: "/parts" },
          { label: part.code, href: `/parts/${part.id}` },
          { label: "Files" },
        ]}
      />
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg text-on-surface">Files Hub · {part.code}</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Documents grouped by process. G-code opens in the program viewer.
          </p>
        </div>
        <Link href={`/parts/${part.id}`}>
          <Button variant="secondary">Back to part</Button>
        </Link>
      </div>

      <div className="space-y-4">
        <Panel title="Part-Level Documents">
          <FileTable
            rows={part.partFiles.map((f) => ({
              id: f.id,
              name: f.name,
              version: "—",
              size: f.sizeLabel,
              date: f.uploadedAt,
              href: undefined,
            }))}
          />
        </Panel>

        {part.processes.map((proc) => {
          const v = getCurrentVersion(proc);
          return (
            <Panel
              key={proc.id}
              title={`${proc.name} Files`}
              action={
                <span className="font-mono text-code-sm text-on-surface-variant">
                  v{proc.currentVersion} current
                </span>
              }
            >
              {v.files.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No files yet"
                    description="Upload G-code, setup sheets, or macros for this process version."
                    action={
                      <Button variant="secondary">
                        <Upload className="h-4 w-4" />
                        Upload file
                      </Button>
                    }
                  />
                </div>
              ) : (
                <FileTable
                  rows={v.files.map((f) => ({
                    id: f.id,
                    name: f.name,
                    version: `v${f.versionNumber ?? proc.currentVersion}`,
                    size: f.sizeLabel,
                    date: f.uploadedAt,
                    href:
                      f.kind === "gcode"
                        ? `/parts/${part.id}/processes/${proc.id}/viewer?file=${f.id}`
                        : undefined,
                  }))}
                />
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function FileTable({
  rows,
}: {
  rows: {
    id: string;
    name: string;
    version: string;
    size: string;
    date: string;
    href?: string;
  }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="p-4 text-body-sm text-on-surface-variant">No documents in this section.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-surface-low">
          <tr className="label-caps text-on-surface-variant">
            <th className="px-4 py-2 font-bold">Name</th>
            <th className="px-4 py-2 font-bold">Version</th>
            <th className="px-4 py-2 font-bold">Size</th>
            <th className="px-4 py-2 font-bold">Date</th>
            <th className="px-4 py-2 font-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-t border-outline-variant/40 transition-colors hover:bg-surface-low/50"
            >
              <td className="px-4 py-2.5">
                {r.href ? (
                  <Link
                    href={r.href}
                    className="cursor-pointer font-mono text-code-md text-primary underline decoration-dashed underline-offset-4 hover:text-primary-container"
                  >
                    {r.name}
                  </Link>
                ) : (
                  <span className="font-mono text-code-md text-on-surface">{r.name}</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <span className="rounded-sm bg-surface-variant px-1.5 py-0.5 font-mono text-code-sm">
                  {r.version}
                </span>
              </td>
              <td className="px-4 py-2.5 font-mono text-code-sm text-on-surface-variant">
                {r.size}
              </td>
              <td className="px-4 py-2.5 text-body-sm text-on-surface-variant">{r.date}</td>
              <td className="px-4 py-2.5">
                <div className="flex gap-1">
                  {r.href && (
                    <Link
                      href={r.href}
                      className="cursor-pointer rounded p-1 text-outline hover:text-primary"
                      aria-label="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  )}
                  <button
                    type="button"
                    className="cursor-pointer rounded p-1 text-outline hover:text-primary"
                    aria-label="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
