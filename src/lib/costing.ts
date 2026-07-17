/** MHR is currency/hour; time is minutes. */
export function calcCost(mhr: number, timeMinutes: number): number {
  return mhr * (timeMinutes / 60);
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

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
