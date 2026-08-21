"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { getAllCustomers } from "@/lib/data";
import { Button, Panel, StatusChip } from "@/components/ui/Primitives";
import { CreateCustomerModal } from "@/components/ui/Modals";
import { CustomerStatusToggle } from "@/components/commercial/EntityStatusToggle";
import { DataTable, type PlantColumnDef } from "@/components/plant/DataTable";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

  const allCustomers = useMemo(() => {
    void tick;
    return getAllCustomers();
  }, [tick]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return allCustomers;
    return allCustomers.filter(
      (c) =>
        c.code.toLowerCase().includes(needle) ||
        c.name.toLowerCase().includes(needle) ||
        c.city.toLowerCase().includes(needle) ||
        c.contactName.toLowerCase().includes(needle),
    );
  }, [q, allCustomers]);

  const columns = useMemo<PlantColumnDef<Customer>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        size: 110,
        minSize: 90,
        cell: ({ row }) => (
          <Link
            href={`/customers/${row.original.id}`}
            className="cursor-pointer font-mono text-code-md font-medium text-primary hover:underline"
          >
            {row.original.code}
          </Link>
        ),
      },
      {
        id: "name",
        header: "Name",
        size: 200,
        minSize: 140,
        cell: ({ row }) => (
          <span className="block truncate text-body-sm text-on-surface">
            {row.original.name}
          </span>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        size: 160,
        minSize: 120,
        cell: ({ row }) => (
          <span className="block truncate text-body-sm text-on-surface-variant">
            {row.original.contactName}
          </span>
        ),
      },
      {
        id: "city",
        header: "City",
        size: 120,
        minSize: 90,
        cell: ({ row }) => (
          <span className="font-mono text-code-sm text-on-surface-variant">
            {row.original.city}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        size: 100,
        minSize: 80,
        cell: ({ row }) => <StatusChip status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        size: 100,
        minSize: 90,
        cell: ({ row }) => (
          <span
            onClick={() => setTick((t) => t + 1)}
            onKeyDown={() => undefined}
            role="presentation"
          >
            <CustomerStatusToggle customerId={row.original.id} />
          </span>
        ),
      },
    ],
    [],
  );

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

        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-headline-sm text-on-surface">No customers yet</p>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Add your first buyer to unlock parts and quotes.
            </p>
            <Button className="mt-6" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              New Customer
            </Button>
          </div>
        ) : (
          <div className="p-3">
            <DataTable
              data={filtered}
              columns={columns}
              getRowId={(row) => row.id}
              minWidth={780}
              getRowClassName={(row) =>
                row.status === "Inactive" ? "opacity-55" : undefined
              }
            />
          </div>
        )}
      </Panel>

      {open ? (
        <CreateCustomerModal
          open
          onClose={() => {
            setOpen(false);
            setTick((t) => t + 1);
          }}
        />
      ) : null}
    </div>
  );
}
