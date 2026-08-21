"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Plus, Search, Siren } from "lucide-react";
import { getAllParts } from "@/lib/data";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { getPartQuoteRisk } from "@/lib/factory/selectors";
import { Button, Panel, StatusChip } from "@/components/ui/Primitives";
import { CreatePartModal } from "@/components/ui/Modals";
import { PartStatusToggle } from "@/components/commercial/EntityStatusToggle";
import { DataTable, type PlantColumnDef } from "@/components/plant/DataTable";
import type { Part } from "@/lib/types";

type PartRow = Part & {
  underwater: boolean;
  belowGoal: boolean;
  marginPct: number | null;
};

export default function PartsPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const { breakups, record } = useV2Graph();
  const goal = record.plant.targetGrossMarginPct ?? 20;

  const allParts = useMemo(() => {
    void tick;
    return getAllParts();
  }, [tick]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return allParts;
    return allParts.filter(
      (p) =>
        p.code.toLowerCase().includes(needle) ||
        p.material.toLowerCase().includes(needle) ||
        p.name.toLowerCase().includes(needle) ||
        p.customer.toLowerCase().includes(needle),
    );
  }, [q, allParts]);

  const rows = useMemo<PartRow[]>(() => {
    return filtered.map((p) => {
      const risk = getPartQuoteRisk(
        p.id,
        breakups,
        record.machines,
        record.materialGrades ?? [],
      );
      const underwater = risk?.underwater === true;
      const belowGoal =
        !underwater &&
        risk?.grossMarginPct != null &&
        risk.grossMarginPct < goal;
      return {
        ...p,
        underwater,
        belowGoal,
        marginPct: risk?.grossMarginPct ?? null,
      };
    });
  }, [filtered, breakups, record.machines, record.materialGrades, goal]);

  const urgentInView = rows.filter(
    (p) => p.status !== "Inactive" && (p.underwater || p.belowGoal),
  ).length;

  const columns = useMemo<PlantColumnDef<PartRow>[]>(
    () => [
      {
        id: "code",
        header: "Part code",
        size: 120,
        minSize: 100,
        cell: ({ row }) => (
          <Link
            href={`/parts/${row.original.id}`}
            className="cursor-pointer font-mono text-code-md font-medium text-primary hover:underline"
          >
            {row.original.code}
          </Link>
        ),
      },
      {
        id: "name",
        header: "Name",
        size: 180,
        minSize: 140,
        cell: ({ row }) => (
          <span className="block truncate text-body-sm text-on-surface">
            {row.original.name}
          </span>
        ),
      },
      {
        id: "material",
        header: "Material",
        size: 120,
        minSize: 100,
        cell: ({ row }) => (
          <span className="font-mono text-code-sm text-on-surface-variant">
            {row.original.material}
          </span>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        size: 160,
        minSize: 120,
        cell: ({ row }) => (
          <span className="block truncate text-body-sm text-on-surface-variant">
            {row.original.customer}
          </span>
        ),
      },
      {
        id: "processes",
        header: "Processes",
        size: 90,
        minSize: 80,
        cell: ({ row }) => (
          <span className="font-mono text-code-sm tabular-nums">
            {row.original.processes.length}
          </span>
        ),
      },
      {
        id: "margin",
        header: "Margin",
        size: 110,
        minSize: 90,
        cell: ({ row }) => {
          const { underwater, belowGoal, marginPct } = row.original;
          const hot = underwater || belowGoal;
          return (
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-code-sm tabular-nums ${
                hot ? "font-medium text-error" : "text-on-surface-variant"
              }`}
            >
              {hot ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> : null}
              {marginPct == null ? "—" : `${marginPct.toFixed(1)}%`}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        size: 110,
        minSize: 90,
        cell: ({ row }) => {
          const { underwater, status } = row.original;
          return underwater && status !== "Inactive" ? (
            <StatusChip status="On Hold" />
          ) : (
            <StatusChip status={status} />
          );
        },
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
            <PartStatusToggle partId={row.original.id} />
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
          <h2 className="text-headline-lg tracking-tight text-on-surface">
            Parts
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Process cost uses live Factory Cash MHR · goal margin{" "}
            {goal.toFixed(1)}% · red rows miss it
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {urgentInView > 0 ? (
            <Link href="/urgent" className="press">
              <Button variant="secondary">
                <Siren className="h-4 w-4 text-error" />
                {urgentInView} urgent
              </Button>
            </Link>
          ) : null}
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Part
          </Button>
        </div>
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
            {rows.length} parts
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-headline-sm text-on-surface">No parts yet</p>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Create a customer first, then add a part to start the quote story.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/customers">
                <Button variant="secondary">Customers</Button>
              </Link>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Part
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3">
            <DataTable
              data={rows}
              columns={columns}
              getRowId={(row) => row.id}
              minWidth={900}
              getRowClassName={(row) => {
                if (row.status === "Inactive") return "opacity-55";
                if (row.underwater) return "bg-error-container/40";
                if (row.belowGoal) return "bg-error-container/20";
                return undefined;
              }}
            />
          </div>
        )}
      </Panel>

      {open ? (
        <CreatePartModal
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
