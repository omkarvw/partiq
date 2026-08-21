"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";

function onMasterDataRoute(pathname: string) {
  return (
    pathname.startsWith("/master-data") || pathname.startsWith("/impact")
  );
}

/**
 * When exploring Master data and the user leaves that area, keep the mode
 * unmistakable and offer one obvious way back (handholding for plant owners).
 */
export function MasterDataExploringReturnBanner() {
  const pathname = usePathname();
  const { isDirty, moneyDirty } = useImpactDraft();

  if (!isDirty || onMasterDataRoute(pathname)) return null;

  const returnHref = moneyDirty.materials
    ? "/master-data#part-cost-impact"
    : "/master-data";

  return (
    <div className="sticky top-0 z-30 border-b border-amber-700/35 bg-amber-50 px-4 py-3 shadow-sm sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body-sm font-semibold text-amber-950">
            You are still checking Master data changes
          </p>
          <p className="mt-0.5 text-body-sm text-amber-900/85">
            This part screen is only a look. Your live factory is not updated
            yet. Go back to finish — Discard, save a what-if, or Make live.
          </p>
        </div>
        <Link
          href={returnHref}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-amber-900 px-4 text-body-sm font-medium text-amber-50 hover:bg-amber-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Go back to Master data
        </Link>
      </div>
    </div>
  );
}
