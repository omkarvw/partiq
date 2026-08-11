"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useCallback, useEffect } from "react";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";
import { ImpactCascade } from "@/components/demo/ImpactCascade";
import {
  MhrBreakupChart,
  MhrCompareChart,
} from "@/components/demo/MhrBreakupChart";
import { KpiStat } from "@/components/demo/KpiStat";
import { V2Field, V2Select } from "@/components/v2/V2Ui";
import { IMPACT_SECTIONS } from "@/lib/v2/clientDb";
import { buildMachineCascade } from "@/lib/v2/impactCascade";
import { formatInr } from "@/lib/costing";
import { CostCompositionPanel } from "@/components/plant/CostCompositionPanel";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import {
  AnimatedNumber,
  EASE,
  Reveal,
  useCascade,
} from "@/components/motion/motion-kit";

export default function ImpactOverviewPage() {
  const {
    draft,
    dirty,
    dirtyTotal,
    focusMachineId,
    setFocusMachineId,
    focusType,
    setFocusType,
    draftBreakups,
    draftPlantKpis,
    liveBreakups,
    patchUtilities,
    patchFocusedMachines,
  } = useImpactDraft();
  const { plantKpis: livePlantKpis } = useV2Graph();

  const types = Array.from(new Set(draft.machines.map((m) => m.type)));
  const machinesOfType = draft.machines.filter((m) => m.type === focusType);
  const focusMachine = draft.machines.find((m) => m.id === focusMachineId);
  const baselineBreakup = focusMachineId
    ? liveBreakups[focusMachineId]
    : null;
  const currentBreakup = focusMachineId
    ? draftBreakups[focusMachineId]
    : null;
  const cascade =
    baselineBreakup && currentBreakup
      ? buildMachineCascade(baselineBreakup, currentBreakup)
      : [];

  const leverKey = `${draft.plant.electricityRatePerKwh}-${focusMachine?.utilizationPct ?? 0}-${dirtyTotal}`;
  const cascadeActive = useCascade(leverKey, 3, 160);

  const fmtInrHr = useCallback((v: number) => `${formatInr(v)}/hr`, []);
  const fmtInrMo = useCallback((v: number) => `${formatInr(v)}/mo`, []);

  const profitPct = focusMachine?.desiredProfitPct ?? 30;
  const liveMonthlyCost = (baselineBreakup?.annualMfgCost ?? 0) / 12;
  const draftMonthlyCost = (currentBreakup?.annualMfgCost ?? 0) / 12;
  /** Monthly billings needed at selling MHR to hit machine profit %. */
  const liveBusinessMo = (baselineBreakup?.annualRevenue ?? 0) / 12;
  const draftBusinessMo = (currentBreakup?.annualRevenue ?? 0) / 12;

  const chain = [
    {
      label: "Cash MHR",
      value: currentBreakup?.manufacturingMhr ?? 0,
      prev: baselineBreakup?.manufacturingMhr ?? 0,
      fmt: fmtInrHr,
    },
    {
      label: "Monthly cost",
      value: draftMonthlyCost,
      prev: liveMonthlyCost,
      fmt: fmtInrMo,
    },
    {
      label: `Business @ ${profitPct}% profit`,
      value: draftBusinessMo,
      prev: liveBusinessMo,
      fmt: fmtInrMo,
    },
  ];

  const rate = draft.plant.electricityRatePerKwh;
  const util = focusMachine?.utilizationPct ?? 70;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#decision-cascade") return;
    requestAnimationFrame(() => {
      document
        .getElementById("decision-cascade")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return (
    <div className="space-y-6">
      <Reveal className="grid gap-3 lg:grid-cols-[320px_1fr]">
        <div className="card-surface h-fit rounded-xl border border-outline-variant p-5">
          <h3 className="text-headline-sm text-on-surface">Quick levers</h3>
          <p className="mt-0.5 text-[11.5px] text-on-surface-variant">
            Drag — cascade lights up. Adopt from the commit bar when ready.
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <label className="text-body-sm font-medium text-on-surface">
                  Electricity
                </label>
                <span
                  className={`font-mono text-code-sm tabular-nums ${
                    dirty.utilities ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  ₹{rate.toFixed(2)}/kWh
                </span>
              </div>
              <input
                type="range"
                min={4}
                max={20}
                step={0.25}
                value={rate}
                onChange={(e) => patchUtilities(Number(e.target.value))}
                className="mt-2.5 w-full accent-primary"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <label className="text-body-sm font-medium text-on-surface">
                  Utilization · focus
                </label>
                <span
                  className={`font-mono text-code-sm tabular-nums ${
                    dirty.machines ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  {util.toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={35}
                max={95}
                step={1}
                value={util}
                onChange={(e) =>
                  patchFocusedMachines({
                    utilizationPct: Number(e.target.value),
                  })
                }
                className="mt-2.5 w-full accent-primary"
              />
            </div>
          </div>
        </div>

        <div
          id="decision-cascade"
          className="card-surface scroll-mt-24 rounded-xl border border-outline-variant p-5"
        >
          <h3 className="text-headline-sm text-on-surface">Decision cascade</h3>
          <p className="mt-0.5 text-[11.5px] text-on-surface-variant">
            Cash MHR → monthly cost → business needed for the machine’s profit %
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {chain.map((c, i) => (
              <motion.div
                key={c.label}
                animate={{
                  borderColor:
                    cascadeActive === i
                      ? "rgb(0 104 95)"
                      : "rgb(188 201 198)",
                  backgroundColor:
                    cascadeActive === i
                      ? "rgb(0 104 95 / 0.08)"
                      : "rgb(255 255 255)",
                  scale: cascadeActive === i ? 1.02 : 1,
                }}
                transition={{ duration: 0.28, ease: EASE }}
                className="rounded-xl border px-3.5 py-3"
              >
                <div className="label-caps text-on-surface-variant">
                  {c.label}
                </div>
                <AnimatedNumber
                  value={c.value}
                  format={c.fmt}
                  className="mt-1.5 block text-headline-sm font-semibold text-on-surface"
                />
                {Math.abs(c.value - c.prev) > 0.01 ? (
                  <p className="mt-1 text-[11px] text-on-surface-variant">
                    was {c.fmt(c.prev)}
                  </p>
                ) : null}
              </motion.div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid gap-3 rounded-xl border border-outline-variant bg-surface-lowest p-4 sm:grid-cols-2">
        <V2Field label="Focus type (charts)">
          <V2Select
            value={focusType}
            onChange={(e) => {
              const type = e.target.value;
              setFocusType(type);
              const first = draft.machines.find((m) => m.type === type);
              if (first) setFocusMachineId(first.id);
            }}
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </V2Select>
        </V2Field>
        <V2Field label="Focus machine">
          <V2Select
            value={focusMachineId}
            onChange={(e) => setFocusMachineId(e.target.value)}
          >
            {machinesOfType.map((machine) => (
              <option key={machine.id} value={machine.id}>
                {machine.name}
              </option>
            ))}
          </V2Select>
        </V2Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiStat
          label="Cash MHR · focus"
          value={`${formatInr(currentBreakup?.manufacturingMhr ?? 0)} per hr`}
          numericValue={currentBreakup?.manufacturingMhr ?? 0}
          format={fmtInrHr}
          hint={`Was ${formatInr(baselineBreakup?.manufacturingMhr ?? 0)} per hr`}
          delta={
            (currentBreakup?.manufacturingMhr ?? 0) -
            (baselineBreakup?.manufacturingMhr ?? 0)
          }
          deltaFormat={(v) => formatInr(v)}
        />
        <KpiStat
          label="Monthly cost · focus"
          value={`${formatInr(draftMonthlyCost)}/mo`}
          numericValue={draftMonthlyCost}
          format={fmtInrMo}
          hint={`Was ${formatInr(liveMonthlyCost)}/mo`}
          delta={draftMonthlyCost - liveMonthlyCost}
          deltaFormat={(v) => formatInr(v)}
        />
        <KpiStat
          label={`Business @ ${profitPct}% · focus`}
          value={`${formatInr(draftBusinessMo)}/mo`}
          numericValue={draftBusinessMo}
          format={fmtInrMo}
          hint={`Was ${formatInr(liveBusinessMo)}/mo`}
          delta={draftBusinessMo - liveBusinessMo}
          deltaFormat={(v) => formatInr(v)}
        />
      </div>

      {draftPlantKpis?.costCompositionAnnual ? (
        <CostCompositionPanel
          composition={draftPlantKpis.costCompositionAnnual}
          title="What-if plant cost"
          subtitle="Same money picture as Factory Pulse — on this exploration only"
          compare={livePlantKpis?.costCompositionAnnual}
          breakups={draftBreakups}
          machineNames={Object.fromEntries(
            draft.machines.map((m) => [m.id, m.name]),
          )}
          utilityDetail={[
            {
              label: "Power (all machines)",
              amount: draftPlantKpis.costCompositionAnnual.utilityPower,
            },
            {
              label: "Other utilities",
              amount: draftPlantKpis.costCompositionAnnual.utilityOther,
            },
          ]}
          overheadDetail={draft.overheadLines.map((line) => ({
            label: line.name,
            amount:
              line.kind === "people"
                ? line.headcount * line.salaryPerMonth * 12
                : line.kind === "rent"
                  ? line.areaSqFt * line.rentPerSqFtMonth * 12
                  : line.amountAnnual,
          }))}
        />
      ) : null}

      <div className="rounded-xl border border-outline-variant bg-surface-lowest p-4">
        <p className="mb-3 label-caps text-on-surface-variant">
          Cost areas vs live
        </p>
        <ul className="flex flex-wrap gap-2">
          {IMPACT_SECTIONS.map((section) => (
            <li key={section.id}>
              <Link
                href={section.href}
                className="press inline-flex items-center gap-2 rounded-lg bg-surface-low px-3 py-2 text-body-sm text-on-surface hover:bg-primary/10"
              >
                {dirty[section.id] ? (
                  <span className="impact-dirty-light" aria-hidden />
                ) : (
                  <span className="inline-block h-2 w-2 rounded-full bg-outline-variant" />
                )}
                {section.label}
                {dirty[section.id] ? (
                  <span className="text-code-sm text-amber-700">Changed</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {currentBreakup && baselineBreakup ? (
          <>
            <MhrBreakupChart
              breakup={currentBreakup}
              title={`Cash MHR mix · ${focusMachine?.name ?? "now"}`}
            />
            <MhrCompareChart
              baseline={baselineBreakup}
              current={currentBreakup}
            />
          </>
        ) : null}
      </div>

      {cascade.length > 0 ? (
        <div className="rounded-2xl border border-outline-variant bg-surface-lowest p-4">
          <p className="mb-3 text-body-sm text-on-surface-variant">
            Tap a cost head to open that Impact section and edit it.
          </p>
          <ImpactCascade
            steps={cascade}
            linkToImpact
            activeIndex={cascadeActive}
          />
        </div>
      ) : null}
    </div>
  );
}
