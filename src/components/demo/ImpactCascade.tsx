"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatInr } from "@/lib/costing";
import type { ImpactStep } from "@/lib/factory/types";
import { cascadeStepHref } from "@/lib/v2/impactCascade";

function formatStepValue(step: ImpactStep): string {
  if (step.unit === "%") return `${step.value.toFixed(1)}%`;
  if (step.unit === "₹/hr") return `${formatInr(step.value)}/hr`;
  return formatInr(step.value);
}

function formatPrev(step: ImpactStep): string {
  if (step.unit === "%") return `${step.previousValue.toFixed(1)}%`;
  if (step.unit === "₹/hr") return `${formatInr(step.previousValue)}/hr`;
  return formatInr(step.previousValue);
}

/** Higher is better for margin/profit; higher is worse for costs. */
function higherIsBetter(id: string): boolean {
  return id === "quote-margin" || id === "annual-profit" || id === "plant-profit";
}

const rowClass = (tone: string, clickable: boolean) =>
  `flex min-h-14 flex-1 items-center justify-between gap-3 rounded border px-4 py-3 text-left transition-colors ${tone} ${
    clickable ? "cursor-pointer hover:border-primary hover:bg-primary/5" : ""
  }`;

export function ImpactCascade({
  steps,
  onSelect,
  /** @deprecated Links are always on for known cascade steps. Kept for call-site compat. */
  linkToImpact: _linkToImpact = true,
  activeIndex = -1,
}: {
  steps: ImpactStep[];
  onSelect?: (id: string) => void;
  linkToImpact?: boolean;
  /** Highlights the active cascade step during lever micro-interaction. */
  activeIndex?: number;
}) {
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((step, i) => {
        const delta = step.value - step.previousValue;
        const improved = higherIsBetter(step.id) ? delta > 0 : delta < 0;
        const worsened = higherIsBetter(step.id) ? delta < 0 : delta > 0;
        const lit = activeIndex === i;
        const tone = lit
          ? "border-primary bg-primary/10 ring-2 ring-primary/25"
          : worsened
            ? "border-error/30 bg-error-container/40"
            : improved
              ? "border-primary/30 bg-primary/5"
              : "border-outline-variant bg-surface-low";
        const chip = worsened
          ? "bg-error text-on-error"
          : improved
            ? "bg-primary text-on-primary"
            : "bg-surface-high text-on-surface-variant";

        const href = cascadeStepHref(step.id);

        const body = (
          <>
            <div className="min-w-0">
              <p className="label-caps text-on-surface-variant">
                {i + 1}. {step.label}
              </p>
              <p className="mt-1 font-mono text-headline-sm tabular-nums text-on-surface">
                {formatStepValue(step)}
              </p>
              {step.previousValue !== step.value ? (
                <p className="mt-0.5 text-code-sm text-on-surface-variant">
                  was {formatPrev(step)}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`rounded-sm px-2 py-1 font-mono text-code-sm tabular-nums ${chip}`}
              >
                {step.deltaLabel}
              </span>
              {href || onSelect ? (
                <span className="inline-flex items-center gap-0.5 text-code-sm font-medium text-primary">
                  Edit
                  <ArrowRight className="h-4 w-4" />
                </span>
              ) : null}
            </div>
          </>
        );

        return (
          <li key={step.id} className="flex items-stretch gap-2">
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                className={rowClass(tone, true)}
              >
                {body}
              </button>
            ) : href ? (
              <Link
                href={href}
                className={rowClass(tone, true)}
                aria-label={`Edit ${step.label} in Impact lab`}
              >
                {body}
              </Link>
            ) : (
              <div className={rowClass(tone, false)}>{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
