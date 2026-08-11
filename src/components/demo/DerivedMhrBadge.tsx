import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatInr } from "@/lib/costing";
import { StatusChip } from "@/components/ui/Primitives";

export function DerivedMhrBadge({
  machineId,
  machineName,
  mhr,
}: {
  machineId: string;
  machineName: string;
  mhr: number;
}) {
  return (
    <Link
      href={`/factory/${machineId}`}
      className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-primary/30 bg-primary/5 px-2 py-1 transition-colors hover:bg-primary/10"
    >
      <StatusChip status="Active" />
      <span className="text-body-sm text-on-surface">
        From {machineName} ·{" "}
        <span className="font-mono tabular-nums text-primary">
          {formatInr(mhr)}/hr
        </span>
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
    </Link>
  );
}
