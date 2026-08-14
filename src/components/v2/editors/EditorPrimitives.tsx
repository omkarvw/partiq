"use client";

import { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { V2Field, V2Input } from "@/components/v2/V2Ui";
import { annualToPerHour } from "@/lib/v2/clientDb";
import { formatInr } from "@/lib/costing";

export function Section({
  title,
  body,
  children,
  compact = true,
}: {
  title: string;
  body?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={`rounded-lg border border-outline-variant bg-surface-lowest ${
        compact ? "p-3 sm:p-3.5" : "p-4"
      }`}
    >
      <h2
        className={`${compact ? "text-body-md font-semibold" : "text-headline-sm"} text-on-surface`}
      >
        {title}
      </h2>
      {body ? (
        <p
          className={`text-on-surface-variant ${
            compact ? "mt-0.5 text-[12px] leading-snug" : "mt-1 text-body-sm"
          }`}
        >
          {body}
        </p>
      ) : null}
      <div className={compact ? "mt-2.5" : "mt-4"}>{children}</div>
    </section>
  );
}

export function Num({
  label,
  value,
  onChange,
  step = 1,
  required,
  error,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  required?: boolean;
  error?: string | null;
}) {
  const empty = required && !(value > 0);
  return (
    <V2Field
      label={label}
      required={required}
      error={error ?? (empty ? "Required" : null)}
    >
      <V2Input
        type="number"
        step={step}
        invalid={Boolean(error) || empty}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </V2Field>
  );
}

export function HrHint({ annual, hours }: { annual: number; hours: number }) {
  return (
    <p className="money-pop mt-1 font-mono text-body-sm">
      → {formatInr(annualToPerHour(annual, hours))}/hr
    </p>
  );
}

/** Dense table/list delete — icon only, keeps rows compact. */
export function RemoveIconButton({
  onClick,
  label = "Remove",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-error hover:bg-error/10"
      onClick={onClick}
    >
      <Trash2 className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}

/** Collapsible block for labour / tooling / similar setup panels. */
export function CollapsibleBlock({
  title,
  subtitle,
  accent = "neutral",
  defaultOpen = true,
  headerRight,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  accent?: "labour" | "tooling" | "money" | "neutral";
  defaultOpen?: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rail =
    accent === "labour"
      ? "border-l-[3px] border-l-primary"
      : accent === "tooling"
        ? "border-l-[3px] border-l-info"
        : accent === "money"
          ? "border-l-[3px] border-l-accent"
          : "border-l-[3px] border-l-outline-variant";

  return (
    <div
      className={`rounded-lg border border-outline-variant bg-surface-lowest ${rail}`}
    >
      <div className="flex flex-wrap items-center gap-2 px-2.5 py-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronDown
            className={`mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant transition-transform ${
              open ? "rotate-0" : "-rotate-90"
            }`}
          />
          <span className="min-w-0">
            <span className="block text-body-sm font-semibold text-on-surface">
              {title}
            </span>
            {subtitle ? (
              <span className="mt-0.5 block text-[11px] text-on-surface-variant">
                {subtitle}
              </span>
            ) : null}
          </span>
        </button>
        {headerRight ? (
          <div
            className="flex flex-wrap gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {headerRight}
          </div>
        ) : null}
      </div>
      {open ? <div className="space-y-2.5 px-2.5 pb-2.5">{children}</div> : null}
    </div>
  );
}
