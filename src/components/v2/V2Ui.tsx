"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function V2Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="label-caps mb-1.5 flex items-center gap-1 text-on-surface-variant">
        {label}
        {required ? <span className="text-error">*</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-code-sm text-error">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-code-sm text-on-surface-variant">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function V2Input({
  invalid,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  // Never set HTML required — browser bubbles break PartIq chrome; use V2Field error.
  return (
    <input
      {...props}
      aria-required={required || undefined}
      aria-invalid={invalid || undefined}
      className={`min-h-11 w-full rounded-sm border bg-surface-lowest px-3 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary ${
        invalid
          ? "border-error ring-1 ring-error/30"
          : "border-outline-variant"
      } ${props.className ?? ""}`}
    />
  );
}

export function V2Select({
  invalid,
  required,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      aria-required={required || undefined}
      aria-invalid={invalid || undefined}
      className={`min-h-11 w-full rounded-sm border bg-surface-lowest px-3 text-body-sm text-on-surface focus:border-primary ${
        invalid
          ? "border-error ring-1 ring-error/30"
          : "border-outline-variant"
      } ${props.className ?? ""}`}
    />
  );
}

export function V2Textarea({
  invalid,
  required,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      aria-required={required || undefined}
      aria-invalid={invalid || undefined}
      className={`min-h-16 w-full rounded-sm border bg-surface-lowest px-3 py-2 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary ${
        invalid
          ? "border-error ring-1 ring-error/30"
          : "border-outline-variant"
      } ${props.className ?? ""}`}
    />
  );
}

export function V2PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-sm bg-primary px-5 text-body-sm font-medium text-on-primary shadow-sm transition duration-200 hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function V2SecondaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-sm border border-outline-variant bg-surface-lowest px-5 text-body-sm font-medium text-on-surface transition duration-200 hover:bg-surface-high active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function StepProgress({
  step,
  total,
  label,
}: {
  step: number;
  total: number;
  label: string;
}) {
  const reduced = useReducedMotion();
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-body-sm font-medium text-on-surface">{label}</p>
        <p className="font-mono text-code-sm text-on-surface-variant">
          {step}/{total}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-high">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduced ? 0 : 0.35, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function IssuesBanner({
  title,
  errors,
  warnings,
}: {
  title?: string;
  errors: string[];
  warnings?: string[];
}) {
  if (errors.length === 0 && (!warnings || warnings.length === 0)) return null;
  return (
    <div className="mb-4 space-y-2">
      {errors.length > 0 ? (
        <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-on-surface">
          <p className="font-medium text-error">
            {title ?? "Fill required fields"}
          </p>
          <ul className="mt-1 list-inside list-disc text-on-surface-variant">
            {errors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {warnings && warnings.length > 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-low/60 px-4 py-3 text-body-sm text-on-surface-variant">
          <p className="font-medium text-on-surface">Recommended</p>
          <ul className="mt-1 list-inside list-disc">
            {warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function StoryPanel({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-lowest p-8 shadow-industrial sm:p-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
      />
      <p className="label-caps text-primary">{eyebrow}</p>
      <h1 className="mt-3 max-w-xl text-headline-lg text-on-surface">{title}</h1>
      <p className="mt-3 max-w-xl text-body-md text-on-surface-variant">{body}</p>
      {children ? <div className="mt-8">{children}</div> : null}
    </motion.section>
  );
}
