"use client";

/**
 * Shared form controls without HTML5 constraint validation.
 * Native `required` / browser bubbles are intentionally unused —
 * show inline errors after the user attempts submit (`attempted`).
 */

export function fieldInvalidClass(invalid: boolean, extra = "") {
  return [
    "w-full rounded-sm border bg-surface px-3 py-2 font-mono text-code-md focus:border-primary",
    invalid
      ? "border-error ring-1 ring-error/30"
      : "border-outline-variant",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  error,
  attempted,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  /** Explicit error; otherwise required+empty shows when attempted. */
  error?: string | null;
  attempted?: boolean;
}) {
  const empty = required && !String(value ?? "").trim();
  const message = error ?? (attempted && empty ? "Required" : null);
  const invalid = Boolean(message);

  return (
    <label className="block">
      <span className="label-caps mb-1 block text-on-surface-variant">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        className={fieldInvalidClass(invalid)}
      />
      {message ? (
        <span className="mt-1 block text-[11px] text-error">{message}</span>
      ) : null}
    </label>
  );
}

export function FormSelect({
  label,
  value,
  onChange,
  required,
  attempted,
  error,
  children,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  attempted?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  const empty = required && !value.trim();
  const message = error ?? (attempted && empty ? "Required" : null);
  const invalid = Boolean(message);

  return (
    <label className={`block ${className ?? ""}`}>
      <span className="label-caps mb-1 block text-on-surface-variant">
        {label}
        {required ? " *" : ""}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        className={`${fieldInvalidClass(invalid, "cursor-pointer")}`}
      >
        {children}
      </select>
      {message ? (
        <span className="mt-1 block text-[11px] text-error">{message}</span>
      ) : null}
    </label>
  );
}
