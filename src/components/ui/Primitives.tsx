import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="mb-2 flex flex-wrap items-center gap-1 text-body-sm text-on-surface-variant">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {item.href ? (
            <Link href={item.href} className="cursor-pointer hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-on-surface">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded border border-outline-variant bg-surface-lowest ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-low/50 px-4 py-3">
          {title ? <h3 className="text-headline-sm text-on-surface">{title}</h3> : <div />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles = {
    primary:
      "bg-primary text-on-primary hover:bg-primary/90 shadow-sm",
    secondary:
      "bg-surface-lowest border border-outline-variant text-on-surface hover:bg-surface-high",
    ghost: "text-secondary hover:bg-surface-container",
    danger:
      "border border-error-container text-error hover:bg-error-container/20",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-sm px-4 py-2 text-body-sm font-medium transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function StatusChip({ status }: { status: string }) {
  const color =
    status === "In Production" ||
    status === "Accepted" ||
    status === "Quoted" ||
    status === "Sent" ||
    status === "Active"
      ? "bg-primary/10 text-primary"
      : status === "Complete" ||
          status === "Closed" ||
          status === "Superseded" ||
          status === "Inactive"
        ? "bg-surface-container text-secondary"
        : status === "On Hold" ||
            status === "Rejected" ||
            status === "No Response"
          ? "bg-error-container/40 text-error"
          : status === "Negotiate" ||
              status === "Quoting" ||
              status === "In Review" ||
              status === "Draft" ||
              status === "New"
            ? "bg-secondary-container/30 text-on-secondary-container"
            : "bg-surface-high text-secondary";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-code-sm ${color}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function VarianceChip({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="font-mono text-code-sm text-secondary">—</span>;
  const overrun = pct > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 font-mono text-code-sm font-bold ${
        overrun ? "bg-error-container/40 text-error" : "bg-primary/10 text-primary"
      }`}
    >
      {overrun ? "↑" : "↓"} {overrun ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded border border-dashed border-outline-variant bg-surface-lowest px-8 py-16 text-center">
      <h3 className="text-headline-md text-on-surface">{title}</h3>
      <p className="mt-2 max-w-md text-body-md text-on-surface-variant">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
