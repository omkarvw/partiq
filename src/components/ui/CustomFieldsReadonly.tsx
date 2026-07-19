import type { CustomField } from "@/lib/types";
import { Panel } from "@/components/ui/Primitives";

/** Server-safe read-only custom fields (no client JS). */
export function CustomFieldsReadonly({
  fields,
  title = "Custom Fields",
}: {
  fields: CustomField[];
  title?: string;
}) {
  return (
    <Panel title={title}>
      <div className="p-4">
        {fields.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">No custom fields.</p>
        ) : (
          <dl className="space-y-2">
            {fields.map((f) => (
              <div
                key={f.id}
                className="flex items-baseline justify-between gap-4 border-b border-outline-variant/40 pb-2 last:border-0 last:pb-0"
              >
                <dt className="text-body-sm text-on-surface-variant">
                  {f.label || "—"}
                </dt>
                <dd className="font-mono text-code-sm text-on-surface">
                  {f.value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Panel>
  );
}
