"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Parse YYYY-MM-DD to local Date at noon (avoid TZ edge cases). */
export function parseIsoDate(iso: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

export function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) return iso || "Select date";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1, 12, 0, 0, 0);
}

/** Monday-first calendar cells for a month view. */
function buildCalendarCells(viewMonth: Date) {
  const first = startOfMonth(viewMonth);
  const year = first.getFullYear();
  const month = first.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = (first.getDay() + 6) % 7;

  const cells: { date: Date; inMonth: boolean }[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month, -i, 12, 0, 0, 0),
      inMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: new Date(year, month, d, 12, 0, 0, 0),
      inMonth: true,
    });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({
      date: new Date(
        last.getFullYear(),
        last.getMonth(),
        last.getDate() + 1,
        12,
        0,
        0,
        0,
      ),
      inMonth: false,
    });
  }
  return cells;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DatePicker({
  label,
  value,
  onChange,
  required,
  placeholder = "Select date",
}: {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selected ?? new Date()),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = parseIsoDate(value);
    if (next) setViewMonth(startOfMonth(next));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cells = useMemo(() => buildCalendarCells(viewMonth), [viewMonth]);
  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12, 0, 0, 0);
  }, []);

  return (
    <div className="relative block" ref={rootRef}>
      {label ? (
        <span className="label-caps mb-1 block text-on-surface-variant">
          {label}
          {required ? " *" : ""}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm border border-outline-variant bg-surface px-3 py-2 text-left font-mono text-code-md text-on-surface transition-colors hover:border-primary/50 focus:border-primary"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={value ? "text-on-surface" : "text-on-surface-variant"}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-on-surface-variant" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={label ?? "Choose date"}
          className="absolute left-0 top-full z-[110] mt-1 w-[280px] rounded border border-outline-variant bg-surface-lowest p-3 shadow-industrial"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-headline-sm text-on-surface">
              {MONTHS[viewMonth.getMonth()]}, {viewMonth.getFullYear()}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                className="cursor-pointer rounded-sm p-1 text-on-surface-variant hover:bg-surface-high hover:text-primary"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="cursor-pointer rounded-sm p-1 text-on-surface-variant hover:bg-surface-high hover:text-primary"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="label-caps py-1 text-center text-[10px] text-on-surface-variant"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map(({ date, inMonth }) => {
              const iso = formatIsoDate(date);
              const isSelected = selected ? sameDay(date, selected) : false;
              const isToday = sameDay(date, today);
              return (
                <button
                  key={iso + String(inMonth)}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={`flex h-8 cursor-pointer items-center justify-center rounded-sm font-mono text-code-sm transition-colors ${
                    isSelected
                      ? "bg-primary font-bold text-on-primary"
                      : inMonth
                        ? "text-on-surface hover:bg-primary/10 hover:text-primary"
                        : "text-outline/60 hover:bg-surface-low"
                  } ${!isSelected && isToday ? "ring-1 ring-primary/40" : ""}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-outline-variant pt-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="cursor-pointer text-body-sm font-medium text-on-surface-variant hover:text-primary"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(formatIsoDate(today));
                setViewMonth(startOfMonth(today));
                setOpen(false);
              }}
              className="cursor-pointer text-body-sm font-medium text-primary hover:underline"
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
