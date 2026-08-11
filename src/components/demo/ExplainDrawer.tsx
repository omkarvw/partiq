"use client";

import { X } from "lucide-react";
import { formatInr } from "@/lib/costing";
import type { ExplainNode } from "@/lib/factory/types";
import { Button } from "@/components/ui/Primitives";

function formatValue(node: ExplainNode): string {
  if (node.unit === "₹" || node.unit === "₹/hr" || node.unit === "₹/kWh") {
    const base = formatInr(node.value);
    if (node.unit === "₹/hr") return `${base}/hr`;
    if (node.unit === "₹/kWh") return `${base}/kWh`;
    return base;
  }
  if (node.unit === "%") return `${node.value.toFixed(1)}%`;
  if (node.unit === "hrs") {
    return `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(node.value)} hrs`;
  }
  return `${node.value} ${node.unit}`;
}

function NodeBlock({
  node,
  depth = 0,
  onSelect,
}: {
  node: ExplainNode;
  depth?: number;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className={depth > 0 ? "ml-3 border-l border-outline-variant pl-3" : ""}>
      <button
        type="button"
        onClick={() => onSelect?.(node.id)}
        className="mb-2 w-full cursor-pointer rounded-sm border border-outline-variant bg-surface-low px-3 py-2 text-left transition-colors hover:border-primary/40"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-body-sm font-medium text-on-surface">
            {node.label}
          </span>
          <span className="shrink-0 font-mono text-code-md tabular-nums text-primary">
            {formatValue(node)}
          </span>
        </div>
        <p className="mt-1 text-body-sm text-on-surface-variant">{node.formula}</p>
      </button>
      {node.children?.map((child) => (
        <NodeBlock
          key={child.id}
          node={child}
          depth={depth + 1}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export function ExplainDrawer({
  open,
  title,
  node,
  onClose,
  onSelectChild,
}: {
  open: boolean;
  title: string;
  node: ExplainNode | null;
  onClose: () => void;
  onSelectChild?: (id: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        aria-label="Close explain panel"
        className="absolute inset-0 cursor-pointer bg-on-secondary-fixed/40"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-outline-variant bg-surface-lowest shadow-industrial animate-in">
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <div>
            <p className="label-caps text-on-surface-variant">Explainability</p>
            <h3 className="text-headline-sm text-on-surface">{title}</h3>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {node ? (
            <NodeBlock node={node} onSelect={onSelectChild} />
          ) : (
            <p className="text-body-sm text-on-surface-variant">
              Select a cost head to see formula and inputs.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
