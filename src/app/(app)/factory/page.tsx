"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { formatInr } from "@/lib/costing";
import { CostCompositionPanel } from "@/components/plant/CostCompositionPanel";
import { AddMachineModal } from "@/components/plant/AddMachineModal";
import { ConfirmDialog } from "@/components/plant/ConfirmDialog";
import {
  createDefaultSection,
  distinctMachineTypes,
  machineProductiveHours,
  type V2MachineDraft,
  type V2Section,
} from "@/lib/v2/clientDb";
import type { MhrBreakup } from "@/lib/factory/types";
import { Button } from "@/components/ui/Primitives";
import { AnimatedNumber, Reveal } from "@/components/motion/motion-kit";
import { DataTable, type PlantColumnDef } from "@/components/plant/DataTable";

export default function FactoryPulsePage() {
  const {
    record,
    breakups,
    plantKpis,
    addBulkMachines,
    addMachineType,
    upsertMachine,
    removeMachine,
    setLabourForType,
    setSections,
  } = useV2Graph();

  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [newSectionName, setNewSectionName] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addDefaultSection, setAddDefaultSection] = useState<string | null>(
    null,
  );
  const composition = plantKpis?.costCompositionAnnual;

  const machineNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of record.machines) map[m.id] = m.name;
    return map;
  }, [record.machines]);

  const overheadDetail = useMemo(
    () =>
      record.overheadLines.map((line) => ({
        label: line.name,
        amount:
          line.kind === "people"
            ? line.headcount * line.salaryPerMonth * 12
            : line.kind === "rent"
              ? line.areaSqFt * line.rentPerSqFtMonth * 12
              : line.amountAnnual,
      })),
    [record.overheadLines],
  );

  const utilityDetail = useMemo(() => {
    if (!composition) return [];
    return [
      { label: "Power (all machines)", amount: composition.utilityPower },
      { label: "Other utilities", amount: composition.utilityOther },
    ];
  }, [composition]);

  const sections = useMemo(
    () =>
      [...(record.sections ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [record.sections],
  );

  const filteredMachines = useMemo(() => {
    if (sectionFilter === "all") return record.machines;
    if (sectionFilter === "unassigned") {
      return record.machines.filter((m) => !m.sectionId);
    }
    return record.machines.filter((m) => m.sectionId === sectionFilter);
  }, [record.machines, sectionFilter]);

  const bySection = useMemo(() => {
    const groups = sections.map((sec) => ({
      section: sec,
      machines: record.machines.filter((m) => m.sectionId === sec.id),
    }));
    const unassigned = record.machines.filter(
      (m) => !m.sectionId || !sections.some((s) => s.id === m.sectionId),
    );
    return { groups, unassigned };
  }, [sections, record.machines]);

  const types = distinctMachineTypes(record);

  function openAdd(sectionId: string | null) {
    setAddDefaultSection(sectionId);
    setAddOpen(true);
  }

  function addNamedSection() {
    const name = newSectionName.trim();
    if (!name) return;
    const sec = createDefaultSection(name);
    sec.sortOrder = sections.length;
    setSections([...(record.sections ?? []), sec]);
    setNewSectionName("");
    setSectionFilter(sec.id);
  }

  return (
    <div className="space-y-8 p-4 sm:p-8">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-on-surface-variant">
              Live factory
            </p>
            <h2 className="mt-1 text-headline-lg text-on-surface">
              {record.plant.name || "Your factory"}
            </h2>
            <p className="mt-1 max-w-xl text-body-md text-on-surface-variant">
              One picture of plant cost. Sections below only group machines for
              browsing — they do not change these totals.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/impact">
              <Button variant="secondary">What if we change…</Button>
            </Link>
            <Button
              onClick={() => {
                const secId =
                  sectionFilter !== "all" && sectionFilter !== "unassigned"
                    ? sectionFilter
                    : (sections[0]?.id ?? null);
                openAdd(secId);
              }}
            >
              <Plus className="h-4 w-4" />
              Add machine
            </Button>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Reveal>
          {composition ? (
            <CostCompositionPanel
              composition={composition}
              breakups={breakups}
              machineNames={machineNames}
              utilityDetail={utilityDetail}
              overheadDetail={overheadDetail}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-outline-variant p-8 text-body-sm text-on-surface-variant">
              Add machines in setup or here to see plant cost.
            </div>
          )}
        </Reveal>

        <Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Metric
              label="Blended Cash MHR"
              value={plantKpis?.blendedMhr ?? 0}
              format={(v) => `${formatInr(v)}/hr`}
            />
            <Metric
              label="Machines"
              value={plantKpis?.machineCount ?? 0}
              format={(v) => `${Math.round(v)}`}
            />
            <Metric
              label="Avg utilization"
              value={plantKpis?.utilizationPct ?? 0}
              format={(v) => `${v.toFixed(0)}%`}
            />
          </div>
        </Reveal>
      </div>

      <Reveal>
        <div className="rounded-xl border border-outline-variant bg-surface-lowest p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-headline-sm text-on-surface">Machines</h3>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Group however you think — shopfloor, customer, line, or one
                list.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="min-h-11 rounded-lg border border-outline-variant bg-surface px-3 text-body-sm"
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
              >
                <option value="all">Show: All</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
                <option value="unassigned">Unassigned</option>
              </select>
              <input
                className="min-h-11 rounded-lg border border-outline-variant bg-surface px-3 text-body-sm"
                placeholder="New section name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addNamedSection();
                }}
              />
              <Button variant="secondary" onClick={addNamedSection}>
                Add section
              </Button>
            </div>
          </div>

          {sectionFilter === "all" ? (
            <div className="mt-5 space-y-6">
              {bySection.groups.map(({ section, machines }) => (
                <MachineGroup
                  key={section.id}
                  title={section.name}
                  count={machines.length}
                  machines={machines}
                  breakups={breakups}
                  onAdd={() => openAdd(section.id)}
                  onDelete={removeMachine}
                  sections={sections}
                  onMove={(machineId, nextSectionId) => {
                    const m = record.machines.find((x) => x.id === machineId);
                    if (m) upsertMachine({ ...m, sectionId: nextSectionId });
                  }}
                />
              ))}
              {bySection.unassigned.length > 0 ? (
                <MachineGroup
                  title="Unassigned"
                  count={bySection.unassigned.length}
                  machines={bySection.unassigned}
                  breakups={breakups}
                  onAdd={() => openAdd(null)}
                  onDelete={removeMachine}
                  sections={sections}
                  onMove={(machineId, nextSectionId) => {
                    const m = record.machines.find((x) => x.id === machineId);
                    if (m) upsertMachine({ ...m, sectionId: nextSectionId });
                  }}
                />
              ) : null}
              {record.machines.length === 0 ? (
                <EmptyMachines
                  onAdd={() => openAdd(sections[0]?.id ?? null)}
                />
              ) : null}
            </div>
          ) : (
            <div className="mt-5">
              <MachineGroup
                title={
                  sectionFilter === "unassigned"
                    ? "Unassigned"
                    : sections.find((s) => s.id === sectionFilter)?.name ||
                      "Section"
                }
                count={filteredMachines.length}
                machines={filteredMachines}
                breakups={breakups}
                onAdd={() =>
                  openAdd(
                    sectionFilter === "unassigned" ? null : sectionFilter,
                  )
                }
                onDelete={removeMachine}
                sections={sections}
                onMove={(machineId, nextSectionId) => {
                  const m = record.machines.find((x) => x.id === machineId);
                  if (m) upsertMachine({ ...m, sectionId: nextSectionId });
                }}
              />
            </div>
          )}
        </div>
      </Reveal>

      <AddMachineModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        types={types}
        sections={sections}
        labourByType={record.labourByType}
        typeCounts={Object.fromEntries(
          types.map((t) => [
            t,
            record.machines.filter((m) => m.type === t).length,
          ]),
        )}
        defaultSectionId={addDefaultSection}
        onAdd={({ name, type, sectionId, labourRoles, machine }) => {
          addMachineType(type);
          setLabourForType(type, labourRoles);
          addBulkMachines(type, 1, {
            sectionId,
            ...machine,
            ...(name ? { name } : {}),
          });
        }}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  format,
}: {
  label: string;
  value: number;
  format: (v: number) => string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-lowest px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 font-mono text-headline-sm tabular-nums text-on-surface">
        <AnimatedNumber value={value} format={format} />
      </p>
    </div>
  );
}

function EmptyMachines({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant px-6 py-12 text-center">
      <p className="text-headline-sm text-on-surface">No machines yet</p>
      <p className="mt-1 text-body-sm text-on-surface-variant">
        Add your first machine to unlock Cash MHR.
      </p>
      <Button className="mt-4" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Add first machine
      </Button>
    </div>
  );
}

function MachineGroup({
  title,
  count,
  machines,
  breakups,
  onAdd,
  onDelete,
  sections,
  onMove,
}: {
  title: string;
  count: number;
  machines: V2MachineDraft[];
  breakups: Record<string, MhrBreakup>;
  onAdd: () => void;
  onDelete: (id: string) => void;
  sections: V2Section[];
  onMove: (machineId: string, sectionId: string | null) => void;
}) {
  const [pending, setPending] = useState<V2MachineDraft | null>(null);
  const columns = useMemo<PlantColumnDef<V2MachineDraft>[]>(
    () => [
      {
        id: "name",
        header: "Machine",
        size: 200,
        minSize: 160,
        cell: ({ row }) => (
          <Link
            href={`/factory/${row.original.id}`}
            className="block truncate font-medium text-primary hover:underline"
            title={row.original.name}
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "type",
        header: "Type",
        size: 140,
        minSize: 110,
        cell: ({ row }) => (
          <span
            className="block truncate text-body-sm text-on-surface-variant"
            title={row.original.type}
          >
            {row.original.type}
          </span>
        ),
      },
      {
        id: "hours",
        header: "Hrs / yr",
        size: 100,
        minSize: 90,
        cell: ({ row }) => {
          const breakup = breakups[row.original.id];
          const hours = breakup
            ? Math.round(breakup.productiveHoursYear)
            : Math.round(machineProductiveHours(row.original));
          return (
            <span className="block truncate font-mono text-body-sm tabular-nums">
              {hours}
            </span>
          );
        },
      },
      {
        id: "mhr",
        header: "Cash MHR",
        size: 140,
        minSize: 120,
        cell: ({ row }) => {
          const breakup = breakups[row.original.id];
          return (
            <span className="block truncate font-mono text-body-sm tabular-nums">
              {breakup ? `${formatInr(breakup.manufacturingMhr)}/hr` : "—"}
            </span>
          );
        },
      },
      {
        id: "section",
        header: "Section",
        size: 180,
        minSize: 150,
        cell: ({ row }) => (
          <select
            className="h-9 w-full min-w-0 truncate rounded border border-outline-variant bg-surface px-2 text-body-sm"
            value={row.original.sectionId ?? ""}
            onChange={(e) => onMove(row.original.id, e.target.value || null)}
          >
            <option value="">Unassigned</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 110,
        minSize: 110,
        maxSize: 110,
        cell: ({ row }) => (
          <button
            type="button"
            aria-label={`Remove ${row.original.name}`}
            onClick={() => setPending(row.original)}
            className="inline-flex h-9 w-full items-center justify-center gap-1 rounded border border-outline-variant px-2 text-body-sm text-on-surface-variant hover:border-error/40 hover:text-error"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            Remove
          </button>
        ),
      },
    ],
    [breakups, onMove, sections],
  );
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-body-md font-semibold text-on-surface">
          {title}{" "}
          <span className="font-mono text-body-sm font-normal text-on-surface-variant">
            · {count}
          </span>
        </h4>
        <button
          type="button"
          onClick={onAdd}
          className="text-body-sm font-medium text-primary hover:underline"
        >
          Add machine
        </button>
      </div>
      {machines.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">
          No machines here yet.
        </p>
      ) : (
        <DataTable
          data={machines}
          columns={columns}
          getRowId={(row) => row.id}
          minWidth={880}
        />
      )}
      <ConfirmDialog
        open={Boolean(pending)}
        title="Remove this machine?"
        body={
          pending
            ? `${pending.name} will leave the live factory. Cash MHR and plant cost will update immediately.`
            : ""
        }
        confirmLabel="Remove machine"
        tone="danger"
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending) onDelete(pending.id);
        }}
      />
    </div>
  );
}
