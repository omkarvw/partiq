"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { parts } from "@/lib/data";
import { Button, Panel, StatusChip } from "@/components/ui/Primitives";
import { CreatePartModal } from "@/components/ui/Modals";

export default function PartsPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return parts;
    return parts.filter(
      (p) =>
        p.code.toLowerCase().includes(needle) ||
        p.material.toLowerCase().includes(needle) ||
        p.name.toLowerCase().includes(needle) ||
        p.customer.toLowerCase().includes(needle),
    );
  }, [q]);

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg text-on-surface">Parts</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Parts inventory for Mumbai West Plant
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Part
        </Button>
      </div>

      <Panel>
        <div className="flex items-center gap-3 border-b border-outline-variant px-4 py-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2 top-1.5 h-4 w-4 text-on-surface-variant" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search code, material, customer..."
              className="w-full rounded-sm border border-outline-variant bg-surface py-1.5 pl-8 pr-3 text-body-sm focus:border-primary"
            />
          </div>
          <span className="label-caps text-on-surface-variant">
            {filtered.length} parts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-surface-low">
              <tr className="label-caps text-on-surface-variant">
                <th className="px-4 py-2.5 font-bold">Part code</th>
                <th className="px-4 py-2.5 font-bold">Name</th>
                <th className="px-4 py-2.5 font-bold">Material</th>
                <th className="px-4 py-2.5 font-bold">Customer</th>
                <th className="px-4 py-2.5 font-bold">Processes</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-outline-variant/50 transition-colors hover:bg-surface-low/70"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/parts/${p.id}`}
                      className="cursor-pointer font-mono text-code-md font-medium text-primary hover:underline"
                    >
                      {p.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-code-sm text-on-surface-variant">
                    {p.material}
                  </td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                    {p.customer}
                  </td>
                  <td className="px-4 py-3 font-mono text-code-sm">{p.processes.length}</td>
                  <td className="px-4 py-3">
                    <StatusChip status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="mt-4 text-body-sm text-on-surface-variant">
        Demo empty state:{" "}
        <Link href="/parts/empty-demo" className="text-primary hover:underline">
          view no-parts screen
        </Link>
      </p>

      <CreatePartModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
