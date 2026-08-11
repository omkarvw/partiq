"use client";

export function LeverControl({
  label,
  hint,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded border border-outline-variant bg-surface-lowest p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="label-caps text-on-surface-variant">{label}</p>
          {hint ? (
            <p className="mt-1 text-body-sm text-on-surface-variant">{hint}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-24 rounded-sm border border-outline-variant bg-surface-low px-2 py-1.5 text-right font-mono text-body-sm tabular-nums focus:border-primary"
          />
          <span className="text-body-sm text-on-surface-variant">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-primary"
        aria-label={label}
      />
      <div className="mt-1 flex justify-between font-mono text-code-sm text-on-surface-variant">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}
