"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { AlertTriangle, Plus, Search, Siren } from "lucide-react";
import { getAllParts } from "@/lib/data";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { getPartQuoteRisk } from "@/lib/factory/selectors";
import { EASE } from "@/components/motion/motion-kit";
import { Button, Panel, StatusChip } from "@/components/ui/Primitives";
import { CreatePartModal } from "@/components/ui/Modals";
import { PartStatusToggle } from "@/components/commercial/EntityStatusToggle";

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

  const riskByPartId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getPartQuoteRisk>>();
    for (const p of allParts) {
      map.set(p.id, getPartQuoteRisk(p.id, breakups, record.machines));
    }
    return map;
  }, [breakups, record.machines, allParts]);

  const urgentInView = filtered.filter((p) => {
    if (p.status === "Inactive") return false;
    const risk = riskByPartId.get(p.id);
    if (!risk || risk.grossMarginPct == null) return false;
    return risk.underwater || risk.grossMarginPct < goal;
  }).length;

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg tracking-tight text-on-surface">
            Parts
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Goal margin {goal.toFixed(1)}% · red rows miss it
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
            {filtered.length} parts
          </span>
        </div>

        {filtered.length === 0 ? (
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-surface-low">
                <tr className="label-caps text-on-surface-variant">
                  <th className="px-4 py-2.5 font-bold">Part code</th>
                  <th className="px-4 py-2.5 font-bold">Name</th>
                  <th className="px-4 py-2.5 font-bold">Material</th>
                  <th className="px-4 py-2.5 font-bold">Customer</th>
                  <th className="px-4 py-2.5 font-bold">Processes</th>
                  <th className="px-4 py-2.5 font-bold">Margin</th>
                  <th className="px-4 py-2.5 font-bold">Status</th>
                  <th className="px-4 py-2.5 font-bold"> </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const risk = riskByPartId.get(p.id) ?? null;
                  const underwater = risk?.underwater === true;
                  const belowGoal =
                    !underwater &&
                    risk?.grossMarginPct != null &&
                    risk.grossMarginPct < goal;

                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.24,
                        ease: EASE,
                        delay: Math.min(i * 0.03, 0.24),
                      }}
                      className={`border-t border-outline-variant/50 transition-colors ${
                        p.status === "Inactive"
                          ? "opacity-55 hover:bg-surface-low/70"
                          : underwater
                            ? "bg-error-container/40 hover:bg-error-container/55"
                            : belowGoal
                              ? "bg-error-container/20 hover:bg-error-container/35"
                              : "hover:bg-surface-low/70"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/parts/${p.id}`}
                          className="cursor-pointer font-mono text-code-md font-medium text-primary hover:underline"
                        >
                          {p.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-body-md text-on-surface">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-code-sm text-on-surface-variant">
                        {p.material}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                        {p.customer}
                      </td>
                      <td className="px-4 py-3 font-mono text-code-sm">
                        {p.processes.length}
                      </td>
                      <td className="px-4 py-3">
                        {risk ? (
                          <span
                            className={`inline-flex items-center gap-1.5 font-mono text-code-sm tabular-nums ${
                              underwater || belowGoal
                                ? "font-medium text-error"
                                : "text-on-surface-variant"
                            }`}
                          >
                            {(underwater || belowGoal) && (
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            )}
                            {risk.grossMarginPct == null
                              ? "—"
                              : `${risk.grossMarginPct.toFixed(1)}%`}
                          </span>
                        ) : (
                          <span className="text-body-sm text-on-surface-variant">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {underwater && p.status !== "Inactive" ? (
                          <StatusChip status="On Hold" />
                        ) : (
                          <StatusChip status={p.status} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          onClick={() => setTick((t) => t + 1)}
                          onKeyDown={() => undefined}
                          role="presentation"
                        >
                          <PartStatusToggle partId={p.id} />
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
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
