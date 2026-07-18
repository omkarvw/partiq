import type { TimeUnit } from "./types";

/** MHR is currency/hour. Time may be minutes or seconds. */
export function calcCost(
  mhr: number,
  time: number,
  unit: TimeUnit = "minutes",
): number {
  const hours = unit === "seconds" ? time / 3600 : time / 60;
  return mhr * hours;
}

export function toSeconds(time: number, unit: TimeUnit): number {
  return unit === "seconds" ? time : time * 60;
}

export function fromSeconds(seconds: number, unit: TimeUnit): number {
  return unit === "seconds" ? seconds : seconds / 60;
}

export function variancePct(estimated: number, actual: number): number | null {
  if (!estimated) return null;
  return ((actual - estimated) / estimated) * 100;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function timeUnitLabel(unit: TimeUnit): string {
  return unit === "seconds" ? "sec" : "min";
}

export function timeUnitSuffix(unit: TimeUnit): string {
  return unit === "seconds" ? "s" : "m";
}

/** Format a raw time value in its declared unit. */
export function formatTime(time: number, unit: TimeUnit): string {
  if (unit === "seconds") {
    if (time >= 60) {
      const m = Math.floor(time / 60);
      const s = Math.round(time % 60);
      return `${m}m ${String(s).padStart(2, "0")}s`;
    }
    return `${Math.round(time)}s`;
  }
  const h = Math.floor(time / 60);
  const m = Math.round(time % 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/** Format an aggregate duration stored as total seconds. */
export function formatDurationSeconds(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0 && sec > 0) return `${m}m ${String(sec).padStart(2, "0")}s`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

/** @deprecated use formatTime / formatDurationSeconds */
export function formatMinutes(min: number): string {
  return formatTime(min, "minutes");
}
