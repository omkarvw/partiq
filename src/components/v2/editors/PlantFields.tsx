"use client";

import { V2Field, V2Input } from "@/components/v2/V2Ui";
import type { V2PlantDraft } from "@/lib/v2/clientDb";

export function PlantFields({
  plant,
  onChange,
}: {
  plant: V2PlantDraft;
  onChange: (patch: Partial<V2PlantDraft>) => void;
}) {
  const margin = plant.targetGrossMarginPct ?? 20;
  const marginInvalid = !Number.isFinite(margin) || margin < 0 || margin > 80;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <V2Field
        label="Plant name"
        required
        error={!plant.name.trim() ? "Required" : null}
      >
        <V2Input
          invalid={!plant.name.trim()}
          value={plant.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </V2Field>
      <V2Field
        label="City"
        required
        error={!plant.city.trim() ? "Required" : null}
      >
        <V2Input
          invalid={!plant.city.trim()}
          value={plant.city}
          onChange={(e) => onChange({ city: e.target.value })}
        />
      </V2Field>
      <V2Field label="Org label">
        <V2Input
          value={plant.orgLabel}
          onChange={(e) => onChange({ orgLabel: e.target.value })}
        />
      </V2Field>
      <V2Field
        label="Target gross margin %"
        required
        error={marginInvalid ? "Set a goal between 0 and 80" : null}
      >
        <V2Input
          type="number"
          min={0}
          max={80}
          step={0.5}
          invalid={marginInvalid}
          value={margin}
          onChange={(e) =>
            onChange({
              targetGrossMarginPct: Number(e.target.value) || 0,
            })
          }
        />
        <p className="mt-1.5 text-[11px] text-on-surface-variant">
          Parts whose live quote margin falls below this goal appear on{" "}
          <span className="font-medium text-error">Urgent</span>.
        </p>
      </V2Field>
    </div>
  );
}
