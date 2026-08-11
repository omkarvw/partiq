"use client";

import { V2Field, V2Input } from "@/components/v2/V2Ui";
import { annualToPerHour } from "@/lib/v2/clientDb";
import { formatInr } from "@/lib/costing";

export function Section({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-lowest p-4">
      <h2 className="text-headline-sm text-on-surface">{title}</h2>
      {body ? (
        <p className="mt-1 text-body-sm text-on-surface-variant">{body}</p>
      ) : null}
      <div className="mt-4">{children}</div>
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
    <p className="mt-1 font-mono text-body-sm text-primary">
      → {formatInr(annualToPerHour(annual, hours))}/hr
    </p>
  );
}
