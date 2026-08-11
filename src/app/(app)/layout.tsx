"use client";

import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { V2GraphProvider } from "@/components/v2/V2GraphProvider";
import { ImpactDraftProvider } from "@/components/v2/ImpactDraftProvider";
import { AppShell } from "@/components/shell/AppShell";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <V2GraphProvider>
        <ImpactDraftProvider>
          <AppShell>{children}</AppShell>
        </ImpactDraftProvider>
      </V2GraphProvider>
    </SmoothScroll>
  );
}
