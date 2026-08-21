"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ImpactSectionNav } from "@/components/v2/ImpactSectionNav";
import { ImpactCommitBar } from "@/components/v2/ImpactCommitBar";
import { ImpactPreviewStrip } from "@/components/v2/ImpactPreviewStrip";
import { ImpactQueryBootstrap } from "@/components/v2/ImpactQueryBootstrap";

export default function MasterDataLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAudit =
    pathname.startsWith("/master-data/audit") ||
    pathname.startsWith("/impact/audit");

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col">
      <div className="flex-1 p-4 sm:p-8">
        <h2 className="text-headline-lg text-on-surface">Master data</h2>
        <p className="mt-1 max-w-2xl text-body-md text-on-surface-variant">
          Exploring — not your live factory. Change plant costs or material
          rates, see Cash MHR and part cost move below. Save a what-if, or make
          it live only when you are ready.
        </p>
        <div className="mt-4">
          <ImpactSectionNav />
        </div>
        {isAudit ? null : (
          <div className="mt-4">
            <ImpactPreviewStrip />
          </div>
        )}
        <div className="mt-2">{children}</div>
      </div>
      <ImpactCommitBar />
      <Suspense fallback={null}>
        <ImpactQueryBootstrap />
      </Suspense>
    </div>
  );
}
