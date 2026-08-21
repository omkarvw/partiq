"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Section, Num } from "@/components/v2/editors/EditorPrimitives";
import { UtilityLinesTable } from "@/components/v2/editors/UtilityLinesTable";
import { UtilitiesFields } from "@/components/v2/editors/UtilitiesFields";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";
import { useApplyMachineStructure } from "@/components/v2/useApplyMachineStructure";
import { V2Field, V2Select } from "@/components/v2/V2Ui";
import {
  defaultUtilityLines,
  machineProductiveHours,
  syncMachineUtilityAnnual,
  utilityLineAnnual,
  type V2UtilityLine,
} from "@/lib/v2/clientDb";
import {
  machinesAfterUtilityAdd,
  machinesAfterUtilityRemove,
} from "@/lib/v2/utilityStructure";
import { formatInr } from "@/lib/costing";

export default function ImpactUtilitiesPage() {
  const {
    draft,
    moneyDirty,
    focusMachineId,
    setFocusMachineId,
    setFocusType,
    upsertDraftMachine,
    replaceDraftMachines,
    patchUtilities,
  } = useImpactDraft();
  const { confirmStructure, dialog: structureDialog } =
    useApplyMachineStructure();

  const sections = draft.sections ?? [];
  const machines = draft.machines;

  const seedMachine =
    machines.find((m) => m.id === focusMachineId) ?? machines[0] ?? null;

  const [browseSectionId, setBrowseSectionId] = useState(
    () => seedMachine?.sectionId ?? sections[0]?.id ?? "",
  );
  const [browseType, setBrowseType] = useState(
    () => seedMachine?.type ?? "",
  );

  const machinesInSection = useMemo(() => {
    if (!browseSectionId) {
      return machines.filter((m) => !m.sectionId);
    }
    return machines.filter((m) => m.sectionId === browseSectionId);
  }, [machines, browseSectionId]);

  const typesInSection = useMemo(
    () => Array.from(new Set(machinesInSection.map((m) => m.type))),
    [machinesInSection],
  );

  const effectiveType =
    browseType && typesInSection.includes(browseType)
      ? browseType
      : typesInSection[0] ?? "";

  const machinesFiltered = useMemo(
    () => machinesInSection.filter((m) => m.type === effectiveType),
    [machinesInSection, effectiveType],
  );

  const machineId = machinesFiltered.some((m) => m.id === focusMachineId)
    ? focusMachineId
    : machinesFiltered[0]?.id || "";
  const machine = machines.find((m) => m.id === machineId) ?? null;

  const typePeerCount = useMemo(
    () =>
      machine
        ? machines.filter((m) => m.type === machine.type).length
        : 0,
    [machines, machine],
  );

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

  const hours = machine ? machineProductiveHours(machine) : 0;
  const elecYr = machine
    ? machine.powerKw * draft.plant.electricityRatePerKwh * hours
    : 0;

  function selectMachine(id: string) {
    setFocusMachineId(id);
    const m = machines.find((x) => x.id === id);
    if (m) {
      setFocusType(m.type);
      setBrowseType(m.type);
      setBrowseSectionId(m.sectionId ?? "");
    }
  }

  function patchLines(next: V2UtilityLine[]) {
    if (!machine) return;
    upsertDraftMachine(
      syncMachineUtilityAnnual({ ...machine, utilityLines: next }),
    );
  }

  function requestAdd(line: V2UtilityLine) {
    if (!machine) return;
    confirmStructure({
      title: "Add custom utility",
      body: `Add “${line.name || "Custom utility"}” to only ${machine.name}, or every ${machine.type}?`,
      machineName: machine.name,
      machineType: machine.type,
      typeCount: typePeerCount,
      apply: (scope) => {
        replaceDraftMachines(
          machinesAfterUtilityAdd(machines, machine.id, line, scope),
        );
      },
    });
  }

  function requestRemove(line: V2UtilityLine) {
    if (!machine) return;
    confirmStructure({
      title: "Remove utility",
      body: `Remove “${line.name || "utility"}” from only ${machine.name}, or every ${machine.type}?`,
      machineName: machine.name,
      machineType: machine.type,
      typeCount: typePeerCount,
      apply: (scope) => {
        replaceDraftMachines(
          machinesAfterUtilityRemove(machines, machine.id, line, scope),
        );
      },
    });
  }

  return (
    <Section
      title="Utilities"
      body="Plant electricity and per-machine consumables (air, coolant, oils…). These feed the Utility part of Cash MHR."
    >
      {moneyDirty.utilities ? (
        <p className="mb-3 inline-flex items-center gap-2 text-body-sm text-amber-800">
          <span className="impact-dirty-light" />
          Utilities changed vs live
        </p>
      ) : null}

      <div className="mb-5 rounded-md border border-l-[3px] border-outline-variant border-l-primary bg-money-tint/40 p-3">
        <h4 className="mb-2 text-body-sm font-semibold text-on-surface">
          Plant electricity
        </h4>
        <UtilitiesFields
          mode="lever"
          electricityRatePerKwh={draft.plant.electricityRatePerKwh}
          onChange={patchUtilities}
        />
        <p className="mt-2 text-[11px] text-on-surface-variant">
          Draft tariff: ₹{draft.plant.electricityRatePerKwh}/kWh · × machine kW
          × productive hours
        </p>
      </div>

      <div className="border-t border-outline-variant pt-4">
        <h4 className="text-body-sm font-semibold text-on-surface">
          Per-machine utilities
        </h4>
        <p className="mt-0.5 text-[11px] text-on-surface-variant">
          Section → type → machine, then edit the utility table. Add custom
          lines when needed.
        </p>

        {machines.length === 0 ? (
          <p className="mt-4 text-body-sm text-on-surface-variant">
            No machines in this what-if yet.{" "}
            <Link
              href="/master-data/machines"
              className="text-primary hover:underline"
            >
              Add a machine
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <V2Field label="Section">
                <V2Select
                  value={browseSectionId}
                  onChange={(e) => {
                    const nextSec = e.target.value;
                    setBrowseSectionId(nextSec);
                    const inSec = machines.filter((m) =>
                      nextSec ? m.sectionId === nextSec : !m.sectionId,
                    );
                    const types = Array.from(new Set(inSec.map((m) => m.type)));
                    const type = types[0] ?? "";
                    setBrowseType(type);
                    const first = inSec.find((m) => m.type === type) ?? inSec[0];
                    if (first) selectMachine(first.id);
                  }}
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  {machines.some((m) => !m.sectionId) ? (
                    <option value="">Unassigned</option>
                  ) : null}
                </V2Select>
              </V2Field>
              <V2Field label="Type">
                <V2Select
                  value={effectiveType}
                  onChange={(e) => {
                    const type = e.target.value;
                    setBrowseType(type);
                    setFocusType(type);
                    const first = machinesInSection.find((m) => m.type === type);
                    if (first) selectMachine(first.id);
                  }}
                >
                  {typesInSection.length === 0 ? (
                    <option value="">No types</option>
                  ) : (
                    typesInSection.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))
                  )}
                </V2Select>
              </V2Field>
              <V2Field label="Machine">
                <V2Select
                  value={machineId}
                  onChange={(e) => selectMachine(e.target.value)}
                >
                  {machinesFiltered.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </V2Select>
              </V2Field>
            </div>

            {machine ? (
              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)] lg:items-start">
                <div className="rounded-md border border-l-[3px] border-outline-variant border-l-primary bg-surface-lowest p-2.5">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Power
                  </p>
                  <Num
                    label="Connected load (kW)"
                    value={machine.powerKw}
                    step={0.5}
                    onChange={(v) =>
                      upsertDraftMachine({ ...machine, powerKw: v })
                    }
                  />
                  <p className="mt-1 font-mono text-[12px] text-primary">
                    → {formatInr(elecYr)}/yr power
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-info">
                    Other utilities
                  </p>
                  <UtilityLinesTable
                    lines={lines}
                    workingDaysPerYear={machine.workingDaysPerYear}
                    onChange={patchLines}
                    onRequestAdd={requestAdd}
                    onRequestRemove={requestRemove}
                  />
                  <p className="mt-1.5 font-mono text-[12px] text-on-surface">
                    Other {formatInr(otherAnnual)}/yr · utility total{" "}
                    <span className="money-pop font-medium">
                      {formatInr(otherAnnual + elecYr)}/yr
                    </span>
                  </p>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
      {structureDialog}
    </Section>
  );
}
