"use client";

import { Num } from "@/components/v2/editors/EditorPrimitives";
import { V2Field, V2Input, V2SecondaryButton } from "@/components/v2/V2Ui";
import {
  OVERHEAD_PEOPLE_SUGGESTIONS,
  createOverheadLine,
  type V2OhLine,
} from "@/lib/v2/clientDb";

export function OverheadEditor({
  lines,
  onUpsert,
  onRemove,
}: {
  lines: V2OhLine[];
  onUpsert: (line: V2OhLine) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {OVERHEAD_PEOPLE_SUGGESTIONS.slice(0, 6).map((sug) => (
          <V2SecondaryButton
            key={sug.name}
            type="button"
            onClick={() =>
              onUpsert(createOverheadLine(sug.name, "people", sug))
            }
          >
            + {sug.name}
          </V2SecondaryButton>
        ))}
        <V2SecondaryButton
          type="button"
          onClick={() =>
            onUpsert(createOverheadLine("Fixed annual", "fixed_annual"))
          }
        >
          + Fixed annual
        </V2SecondaryButton>
      </div>
      {lines.map((line) => (
        <div
          key={line.id}
          className="grid gap-2 rounded border border-outline-variant p-3 sm:grid-cols-4"
        >
          <V2Field label="Name">
            <V2Input
              value={line.name}
              onChange={(e) => onUpsert({ ...line, name: e.target.value })}
            />
          </V2Field>
          {line.kind === "people" ? (
            <>
              <Num
                label="Headcount"
                value={line.headcount}
                onChange={(v) => onUpsert({ ...line, headcount: v })}
              />
              <Num
                label="Salary / mo"
                value={line.salaryPerMonth}
                onChange={(v) => onUpsert({ ...line, salaryPerMonth: v })}
              />
            </>
          ) : line.kind === "rent" ? (
            <>
              <Num
                label="Area sq ft"
                value={line.areaSqFt}
                onChange={(v) => onUpsert({ ...line, areaSqFt: v })}
              />
              <Num
                label="Rent / sq ft / mo"
                value={line.rentPerSqFtMonth}
                onChange={(v) => onUpsert({ ...line, rentPerSqFtMonth: v })}
              />
            </>
          ) : (
            <Num
              label="₹ / year"
              value={line.amountAnnual}
              onChange={(v) => onUpsert({ ...line, amountAnnual: v })}
            />
          )}
          <div className="flex items-end">
            <button
              type="button"
              className="text-body-sm text-error"
              onClick={() => onRemove(line.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
