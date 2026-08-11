"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { AnimatedNumber, DeltaChip } from "@/components/motion/motion-kit";

export function KpiStat({
  label,
  value,
  hint,
  icon,
  chip,
  onClick,
  numericValue,
  format,
  delta,
  deltaFormat,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  chip?: ReactNode;
  onClick?: () => void;
  /** When set, value animates with Lovable-style number ticker. */
  numericValue?: number;
  format?: (v: number) => string;
  delta?: number;
  deltaFormat?: (v: number) => string;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`card-surface lift rounded-xl border border-outline-variant bg-surface-lowest p-4 text-left ${
        onClick ? "press cursor-pointer hover:border-primary/40" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="label-caps text-on-surface-variant">{label}</span>
        <div className="flex items-center gap-2">
          {delta !== undefined && deltaFormat ? (
            <DeltaChip delta={delta} format={deltaFormat} />
          ) : null}
          {icon ? <span className="text-primary">{icon}</span> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        {numericValue !== undefined && format ? (
          <AnimatedNumber
            value={numericValue}
            format={format}
            className="text-headline-md font-semibold text-on-surface"
          />
        ) : (
          <p className="font-mono text-headline-md tabular-nums text-on-surface">
            {value}
          </p>
        )}
        {chip}
      </div>
      {hint ? (
        <p className="mt-1 text-body-sm text-on-surface-variant">{hint}</p>
      ) : null}
    </Comp>
  );
}

/** Soft lift wrapper for any surface that should feel pressable. */
export function LiftSurface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={`card-surface lift ${className}`}>{children}</motion.div>
  );
}
