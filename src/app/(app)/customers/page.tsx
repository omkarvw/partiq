"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { customers } from "@/lib/data";
import { Button, Panel, StatusChip } from "@/components/ui/Primitives";
import { CreateCustomerModal } from "@/components/ui/Modals";

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter(
      (c) =>
        c.code.toLowerCase().includes(needle) ||
        c.name.toLowerCase().includes(needle) ||
        c.city.toLowerCase().includes(needle) ||
        c.contactName.toLowerCase().includes(needle),
    );
  }, [q]);

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg text-on-surface">Customers</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Master data for OEMs and internal cost centers used on parts and RFQs.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New Customer
        </Button>
      </div>

      <Panel>
        <div className="flex items-center gap-3 border-b border-outline-variant px-4 py-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2 top-1.5 h-4 w-4 text-on-surface-variant" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search code, name, city, contact…"
              className="w-full rounded-sm border border-outline-variant bg-surface py-1.5 pl-8 pr-3 text-body-sm focus:border-primary"
            />
          </div>
          <span className="label-caps text-on-surface-variant">
            {filtered.length} customers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-surface-low">
              <tr className="label-caps text-on-surface-variant">
                <th className="px-4 py-2.5 font-bold">Code</th>
                <th className="px-4 py-2.5 font-bold">Name</th>
                <th className="px-4 py-2.5 font-bold">Contact</th>
                <th className="px-4 py-2.5 font-bold">City</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-outline-variant/50 transition-colors hover:bg-surface-low/70"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/customers/${c.id}`}
                      className="cursor-pointer font-mono text-code-md font-medium text-primary hover:underline"
                    >
                      {c.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-body-md text-on-surface">{c.name}</td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                    {c.contactName}
                  </td>
                  <td className="px-4 py-3 font-mono text-code-sm text-on-surface-variant">
                    {c.city}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {open ? <CreateCustomerModal open onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
