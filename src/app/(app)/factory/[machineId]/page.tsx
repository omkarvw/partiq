"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { KpiStat } from "@/components/demo/KpiStat";
import {
  MhrBreakupChart,
  MhrCompareChart,
} from "@/components/demo/MhrBreakupChart";
import { MhrBreakupPanel } from "@/components/demo/MhrBreakupPanel";
import { ExplainDrawer } from "@/components/demo/ExplainDrawer";
import { buildMhrExplainTree, findExplainNode } from "@/lib/factory/explain";
import { toFactoryInputs, toMachineInputs } from "@/lib/v2/clientDb";
import { formatInr } from "@/lib/costing";
import { Breadcrumbs, Button } from "@/components/ui/Primitives";
import { ConfirmDialog } from "@/components/plant/ConfirmDialog";

export default function V2MachinePage({
  params,
}: {
  params: Promise<{ machineId: string }>;
}) {
  const { machineId } = use(params);
  const router = useRouter();
  const { record, breakups, removeMachine } = useV2Graph();
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const machine = record.machines.find((item) => item.id === machineId);
  const breakup = breakups[machineId];

  if (!machine || !breakup) {
    return (
      <div className="p-8">
        <p className="text-body-md text-on-surface-variant">Machine not found.</p>
        <Link href="/factory" className="mt-3 inline-block text-primary">
          Back to factory
        </Link>
      </div>
    );
  }

  const factory = toFactoryInputs(record.plant, record);
  const machineInput = toMachineInputs(record).find((m) => m.id === machineId);
  if (!machineInput) {
    return (
      <div className="p-8 text-body-md text-on-surface-variant">
        Machine inputs missing.
      </div>
    );
  }
  const tree = buildMhrExplainTree(factory, machineInput, breakup);
  const selected = nodeId ? findExplainNode(tree, nodeId) : null;

  return (
    <div className="p-4 sm:p-8">
      <Breadcrumbs
        items={[
          { label: "Factory", href: "/factory" },
          { label: machine.name },
        ]}
      />
      <div className="mb-6 mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg text-on-surface">{machine.name}</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {machine.type} · Cash MHR (excl. depreciation)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/impact/machines?machine=${machine.id}&type=${encodeURIComponent(machine.type)}`}
            className="inline-flex min-h-11 items-center rounded-lg border border-outline-variant px-4 text-body-sm font-medium text-on-surface hover:bg-surface-low"
          >
            Impact · Machines
          </Link>
          <Link
            href={`/impact/machines?tab=labour&type=${encodeURIComponent(machine.type)}`}
            className="inline-flex min-h-11 items-center rounded-lg border border-outline-variant px-4 text-body-sm font-medium text-on-surface hover:bg-surface-low"
          >
            Impact · Labour
          </Link>
          <Button variant="secondary" onClick={() => setShowTable((v) => !v)}>
            {showTable ? "Hide table" : "Show explain table"}
          </Button>
          <Button variant="secondary" onClick={() => setRemoveOpen(true)}>
            Remove machine
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <KpiStat
          label="Cash MHR (calculated)"
          value={`${formatInr(breakup.manufacturingMhr)} per hr`}
        />
        <KpiStat
          label="Productive hours / year"
          value={new Intl.NumberFormat("en-IN").format(
            Math.round(breakup.productiveHoursYear),
          )}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <MhrBreakupChart breakup={breakup} title="Cash MHR mix" />
        <MhrCompareChart baseline={breakup} current={breakup} />
      </div>

      {showTable ? (
        <MhrBreakupPanel
          breakup={breakup}
          cashOnly
          onSelect={(id) => setNodeId(id)}
        />
      ) : null}

      <ExplainDrawer
        open={Boolean(selected)}
        title={selected?.label ?? "Explain"}
        node={selected}
        onClose={() => setNodeId(null)}
        onSelectChild={(id) => setNodeId(id)}
      />
      <ConfirmDialog
        open={removeOpen}
        title="Remove this machine?"
        body={`${machine.name} will leave the live factory. Cash MHR and plant cost will update immediately.`}
        confirmLabel="Remove machine"
        tone="danger"
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          removeMachine(machine.id);
          router.push("/factory");
        }}
      />
    </div>
  );
}
