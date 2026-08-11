"use client";

import { Suspense } from "react";
import ImpactMachinesPageInner from "./machines-inner";

export default function ImpactMachinesPage() {
  return (
    <Suspense
      fallback={
        <p className="text-body-sm text-on-surface-variant">Loading machines…</p>
      }
    >
      <ImpactMachinesPageInner />
    </Suspense>
  );
}
