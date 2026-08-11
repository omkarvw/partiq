"use client";

import { Num } from "@/components/v2/editors/EditorPrimitives";
import { V2Field, V2Input, V2SecondaryButton } from "@/components/v2/V2Ui";
import { toolingAnnual, type V2ToolingLine } from "@/lib/v2/clientDb";
import { formatInr } from "@/lib/costing";

export function TypeToolingEditor({
  type,
  lines,
  onUpsert,
  onRemove,
}: {
  type: string;
  lines: V2ToolingLine[];
  onUpsert: (line: V2ToolingLine) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded border border-dashed border-outline-variant p-3">
      <p className="mb-2 text-body-sm font-medium">
        Tooling defaults for {type} ({formatInr(toolingAnnual(lines))}/yr)
      </p>
      {lines.map((line) => (
        <div key={line.id} className="mb-2 flex flex-wrap items-end gap-2">
          <V2Field label="Line">
            <V2Input
              value={line.name}
              onChange={(e) => onUpsert({ ...line, name: e.target.value })}
            />
          </V2Field>
          <Num
            label="₹ / year"
            value={line.amountAnnual}
            onChange={(v) => onUpsert({ ...line, amountAnnual: v })}
          />
          <button
            type="button"
            className="text-body-sm text-error"
            onClick={() => onRemove(line.id)}
          >
            Remove
          </button>
        </div>
      ))}
      <V2SecondaryButton
        type="button"
        onClick={() =>
          onUpsert({
            id: `tool-${Date.now()}`,
            name: "New tooling line",
            amountAnnual: 0,
          })
        }
      >
        Add tooling line
      </V2SecondaryButton>
    </div>
  );
}
