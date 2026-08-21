"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, Factory, Siren } from "lucide-react";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { KpiStat } from "@/components/demo/KpiStat";
import { Reveal } from "@/components/motion/motion-kit";
import { listUrgentParts } from "@/lib/factory/selectors";
import { formatInr } from "@/lib/costing";
import { V2PrimaryButton } from "@/components/v2/V2Ui";

export default function V2DashboardPage() {
  const { record, plantKpis, breakups, heroMachineId, activeBaseline } =
    useV2Graph();
  const hero = heroMachineId ? breakups[heroMachineId] : null;
  const heroMachine = record.machines.find((m) => m.id === heroMachineId);
  const goal = record.plant.targetGrossMarginPct ?? 20;

  const urgent = useMemo(
    () => listUrgentParts(breakups, goal, record.machines),
    [breakups, goal, record.machines],
  );

  const machineCount = plantKpis?.machineCount ?? 0;
  const blendedMhr = plantKpis?.blendedMhr ?? 0;
  const capacityHours = Math.round(plantKpis?.capacityHours ?? 0);
  const annualMfg = plantKpis?.annualMfgCost ?? 0;

  const fmtInt = useCallback((v: number) => `${Math.round(v)}`, []);
  const fmtInrHr = useCallback((v: number) => `${formatInr(v)}/hr`, []);
  const fmtInr = useCallback((v: number) => formatInr(v), []);
  const fmtLocale = useCallback(
    (v: number) => new Intl.NumberFormat("en-IN").format(Math.round(v)),
    [],
  );

  return (
    <div className="space-y-8 p-4 sm:p-8">
      {urgent.length > 0 ? (
        <Reveal>
          <Link
            href="/urgent"
            className="press card-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/30 bg-error-container/40 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-error/15 text-error">
                <Siren className="h-4 w-4" />
              </span>
              <div>
                <p className="text-body-sm font-semibold text-error">
                  {urgent.length} part{urgent.length === 1 ? "" : "s"} below{" "}
                  {goal.toFixed(1)}% margin goal
                </p>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">
                  Live process cost vs quote — open Urgent to triage.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-body-sm font-medium text-error">
              Open Urgent <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </Reveal>
      ) : null}

      <Reveal>
        <section className="card-surface overflow-hidden rounded-2xl border border-outline-variant bg-[linear-gradient(135deg,#ffffff_0%,#eef8f6_55%,#e8f4f2_100%)] p-6 sm:p-8">
          <p className="label-caps text-primary">Your operating baseline</p>
          <h2 className="mt-2 text-headline-lg tracking-tight text-on-surface">
            {record.plant.name}
          </h2>
          <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
            Built from your onboarding inputs in {record.plant.city}. Every KPI
            below is derived from what you entered — change something in Master
            data and watch these move.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/master-data" className="press">
              <V2PrimaryButton>
                Open Master data
                <ArrowUpRight className="h-4 w-4" />
              </V2PrimaryButton>
            </Link>
            <Link
              href="/factory"
              className="press inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant bg-surface-lowest px-4 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-high"
            >
              <Factory className="h-4 w-4" />
              Review machines
            </Link>
          </div>
        </section>
      </Reveal>

      <Reveal
        delay={0.06}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <KpiStat
          label="Machines"
          value={`${machineCount}`}
          numericValue={machineCount}
          format={fmtInt}
          hint={`${plantKpis?.employees ?? 0} people from roles`}
        />
        <KpiStat
          label="Blended Cash MHR"
          value={formatInr(blendedMhr)}
          numericValue={blendedMhr}
          format={fmtInrHr}
          hint={`Tariff ₹${record.plant.electricityRatePerKwh}/kWh · calculated`}
        />
        <KpiStat
          label="Capacity hours"
          value={new Intl.NumberFormat("en-IN").format(capacityHours)}
          numericValue={capacityHours}
          format={fmtLocale}
          hint={`${(plantKpis?.utilizationPct ?? 0).toFixed(0)}% avg utilization`}
        />
        <KpiStat
          label="Annual mfg cost"
          value={formatInr(annualMfg)}
          numericValue={annualMfg}
          format={fmtInr}
          hint={`${formatInr(blendedMhr)}/hr blended`}
        />
      </Reveal>

      {activeBaseline ? (
        <Reveal delay={0.1}>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-body-sm text-on-surface">
            Working from baseline <strong>{activeBaseline.name}</strong>.{" "}
            <Link href="/baselines" className="font-medium text-primary">
              Manage baselines
            </Link>
          </div>
        </Reveal>
      ) : null}

      {hero && heroMachine ? (
        <Reveal delay={0.12}>
          <section className="card-surface rounded-2xl border border-outline-variant bg-surface-lowest p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="label-caps text-on-surface-variant">
                  Hero machine
                </p>
                <h3 className="text-headline-md tracking-tight text-on-surface">
                  {heroMachine.name}
                </h3>
              </div>
              <Link
                href={`/factory/${heroMachine.id}`}
                className="text-body-sm font-medium text-primary hover:underline"
              >
                Explain MHR
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <KpiStat
                label="Cash MHR (calculated)"
                value={formatInr(hero.manufacturingMhr)}
                numericValue={hero.manufacturingMhr}
                format={fmtInrHr}
              />
              <KpiStat
                label="Productive hours"
                value={new Intl.NumberFormat("en-IN").format(
                  Math.round(hero.productiveHoursYear),
                )}
                numericValue={hero.productiveHoursYear}
                format={fmtLocale}
              />
            </div>
          </section>
        </Reveal>
      ) : null}
    </div>
  );
}
