"use client";

import { Plus, Trash2 } from "lucide-react";
import type { CustomField } from "@/lib/types";
import { Panel } from "@/components/ui/Primitives";

export function CustomFieldsEditor({
  fields,
  onChange,
  title = "Custom Fields",
}: {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  title?: string;
}) {
  return (
    <Panel
      title={title}
      action={
        <button
          type="button"
          onClick={() =>
            onChange([
              ...fields,
              { id: `new-${Date.now()}`, label: "", value: "" },
            ])
          }
          className="inline-flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-body-sm font-medium text-primary transition-colors hover:bg-surface-container"
        >
          <Plus className="h-[18px] w-[18px]" />
          Add Field
        </button>
      }
    >
      <div className="space-y-2 p-4">
        {fields.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">
            No custom fields. Click Add Field to create label / value pairs.
          </p>
        )}
        {fields.map((f) => (
          <div key={f.id} className="group flex items-center gap-2">
            <input
              value={f.label}
              onChange={(e) =>
                onChange(
                  fields.map((x) =>
                    x.id === f.id ? { ...x, label: e.target.value } : x,
                  ),
                )
              }
              placeholder="Label"
              className="w-1/3 rounded-sm border border-outline-variant bg-surface px-3 py-1.5 text-body-sm text-on-surface-variant focus:border-primary"
            />
            <input
              value={f.value}
              onChange={(e) =>
                onChange(
                  fields.map((x) =>
                    x.id === f.id ? { ...x, value: e.target.value } : x,
                  ),
                )
              }
              placeholder="Value"
              className="flex-1 rounded-sm border border-outline-variant bg-surface px-3 py-1.5 text-body-sm focus:border-primary"
            />
            <button
              type="button"
              aria-label="Delete field"
              onClick={() => onChange(fields.filter((x) => x.id !== f.id))}
              className="cursor-pointer rounded p-1.5 text-outline opacity-0 transition-opacity hover:text-error group-hover:opacity-100 focus:opacity-100"
            >
              <Trash2 className="h-[18px] w-[18px]" />
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}
