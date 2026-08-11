"use client";

import { animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Shared product easing — matches Lovable PartIq decision engine. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Numbers interpolate so magnitude is felt, not jumped. */
export function AnimatedNumber({
  value,
  format,
  duration = 0.7,
  className,
}: {
  value: number;
  format: (v: number) => string;
  duration?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced) {
      node.textContent = format(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        node.textContent = format(v);
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration, format, reduced]);

  return (
    <span ref={ref} className={`font-mono tabular-nums ${className ?? ""}`}>
      {format(value)}
    </span>
  );
}

/** Direction-aware delta chip — only when something actually changed. */
export function DeltaChip({
  delta,
  format,
}: {
  delta: number;
  format: (v: number) => string;
}) {
  if (Math.abs(delta) < 0.005) return null;
  const up = delta > 0;
  return (
    <motion.span
      initial={{ opacity: 0, y: up ? 4 : -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: EASE }}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums ${
        up
          ? "bg-error-container/60 text-error"
          : "bg-primary/10 text-primary"
      }`}
    >
      {up ? "▲" : "▼"} {format(Math.abs(delta))}
    </motion.span>
  );
}

/** Quiet page/section entrance — one reveal, not a stagger parade. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Cascade: light nodes in sequence when a plant input changes. */
export function useCascade(trigger: unknown, steps: number, stepMs = 180) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(-1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) return;
    let i = 0;
    setActive(0);
    const t = setInterval(() => {
      i += 1;
      if (i >= steps) {
        clearInterval(t);
        setActive(-1);
      } else setActive(i);
    }, stepMs);
    return () => clearInterval(t);
  }, [trigger, steps, stepMs, reduced]);
  return active;
}
