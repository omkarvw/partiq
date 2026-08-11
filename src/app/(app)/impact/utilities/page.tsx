"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Section, Num } from "@/components/v2/editors/EditorPrimitives";
import { UtilitiesFields } from "@/components/v2/editors/UtilitiesFields";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";
import { V2Field, V2Select } from "@/components/v2/V2Ui";
import {
  defaultUtilityLines,
  machineProductiveHours,
  syncMachineUtilityAnnual,
  utilityLineAnnual,
  type V2UtilityLine,
} from "@/lib/v2/clientDb";
import { formatInr } from "@/lib/costing";

export default function ImpactUtilitiesPage() {
  const {
    draft,
    dirty,
    focusMachineId,
    setFocusMachineId,
    upsertDraftMachine,
    patchUtilities,
  } = useImpactDraft();

  const machines = draft.machines;
  const [localFocus, setLocalFocus] = useState(
    focusMachineId || machines[0]?.id || "",
  );
  const machineId = machines.some((m) => m.id === localFocus)
    ? localFocus
    : machines[0]?.id || "";
  const machine = machines.find((m) => m.id === machineId);

  const lines: V2UtilityLine[] = useMemo(() => {
    if (!machine) return [];
    if (machine.utilityLines?.length) return machine.utilityLines;
    return defaultUtilityLines();
  }, [machine]);

  const otherAnnual = useMemo(() => {
    if (!machine) return 0;
    return lines.reduce(
      (s, line) => s + utilityLineAnnual(line, machine.workingDaysPerYear),
      0,
    );
  }, [lines, machine]);

  function patchLines(next: V2UtilityLine[]) {
    if (!machine) return;
    upsertDraftMachine(
      syncMachineUtilityAnnual({ ...machine, utilityLines: next }),
    );
  }

  return (
    <Section
      title="Utilities"
      body="Plant electricity and per-machine consumables (air, coolant, oils…). These feed the Utility part of Cash MHR and the Utilities slice of plant cost — not a separate bucket outside MHR."
    >
      {dirty.utilities ? (
        <p className="mb-3 inline-flex items-center gap-2 text-body-sm text-amber-700">
          <span className="impact-dirty-light" />
          Utilities changed vs live
        </p>
      ) : null}

      <div className="mb-6">
        <h4 className="mb-2 text-body-md font-semibold text-on-surface">
          Plant electricity
        </h4>
        <UtilitiesFields
          mode="lever"
          electricityRatePerKwh={draft.plant.electricityRatePerKwh}
          onChange={patchUtilities}
        />
        <p className="mt-2 text-body-sm text-on-surface-variant">
          Draft tariff: ₹{draft.plant.electricityRatePerKwh}/kWh · drives power
          cost with each machine’s kW × productive hours
        </p>
      </div>

      <div className="border-t border-outline-variant pt-5">
        <h4 className="text-body-md font-semibold text-on-surface">
          Per-machine utilities
        </h4>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Compressed air, coolant, hydraulic oil, grease, water, misc — same
          Excel utility rows. They roll into Cash MHR as utility ₹/hr.
        </p>

        {machines.length === 0 ? (
          <p className="mt-4 text-body-sm text-on-surface-variant">
            No machines in this what-if yet.{" "}
            <Link href="/impact/machines" className="text-primary hover:underline">
              Add a machine
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="mt-3 max-w-sm">
              <V2Field label="Machine">
                <V2Select
                  value={machineId}
                  onChange={(e) => {
                    setLocalFocus(e.target.value);
                    setFocusMachineId(e.target.value);
                  }}
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.type})
                    </option>
                  ))}
                </V2Select>
              </V2Field>
            </div>

            {machine ? (
              <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Num
                    label="Connected load (kW)"
                    value={machine.powerKw}
                    step={0.5}
                    onChange={(v) =>
                      upsertDraftMachine({ ...machine, powerKw: v })
                    }
                  />
                  <p className="self-end text-body-sm text-on-surface-variant">
                    Power/yr ≈{" "}
                    {formatInr(
                      machine.powerKw *
                        draft.plant.electricityRatePerKwh *
                        machineProductiveHours(machine),
                    )}
                  </p>
                </div>

                {lines.map((line, idx) => (
                  <div
                    key={line.id}
                    className="grid gap-2 rounded-lg border border-outline-variant/70 p-3 sm:grid-cols-4"
                  >
                    <p className="sm:col-span-4 text-body-sm font-medium text-on-surface">
                      {line.name}
                      <span className="ml-2 font-mono text-[11px] font-normal text-on-surface-variant">
                        {formatInr(
                          utilityLineAnnual(line, machine.workingDaysPerYear),
                        )}
                        /yr
                      </span>
                    </p>
                    {line.mode === "annual" ? (
                      <div className="sm:col-span-2">
                        <Num
                          label="₹ / year"
                          value={line.annualAmount}
                          onChange={(v) => {
                            const next = lines.map((l, i) =>
                              i === idx ? { ...l, annualAmount: v } : l,
                            );
                            patchLines(next);
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <Num
                          label="Qty / day"
                          value={line.qtyPerDay}
                          step={0.1}
                          onChange={(v) => {
                            const next = lines.map((l, i) =>
                              i === idx ? { ...l, qtyPerDay: v } : l,
                            );
                            patchLines(next);
                          }}
                        />
                        <Num
                          label="₹ / unit"
                          value={line.ratePerUnit}
                          onChange={(v) => {
                            const next = lines.map((l, i) =>
                              i === idx ? { ...l, ratePerUnit: v } : l,
                            );
                            patchLines(next);
                          }}
                        />
                        <p className="self-end text-[11px] text-on-surface-variant sm:col-span-2">
                          × {machine.workingDaysPerYear || 365} working days/yr
                        </p>
                      </>
                    )}
                  </div>
                ))}

                <p className="font-mono text-body-sm text-on-surface">
                  Other utilities total · {formatInr(otherAnnual)}/yr
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </Section>
  );
}
