"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { useImpactDraft } from "@/components/v2/ImpactDraftProvider";
import { IMPACT_SECTIONS } from "@/lib/v2/clientDb";

export function ImpactSectionNav() {
  const pathname = usePathname();
  const { moneyDirty, moneyDirtyTotal } = useImpactDraft();
  const overviewActive = pathname === "/impact";

  return (
    <nav className="flex flex-wrap gap-1 border-b border-outline-variant pb-3">
      <Link
        href="/impact"
        className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-body-sm font-medium ${
          overviewActive
            ? "bg-primary text-on-primary"
            : "bg-surface-lowest text-on-surface-variant hover:bg-surface-low"
        }`}
      >
        <LayoutDashboard className="h-4 w-4" />
        Overview
        {moneyDirtyTotal > 0 ? (
          <span className="rounded-full bg-on-primary/20 px-1.5 text-[10px]">
            {moneyDirtyTotal} changed
          </span>
        ) : null}
      </Link>
      {IMPACT_SECTIONS.map((section) => {
        const active =
          pathname === section.href || pathname.startsWith(`${section.href}/`);
        const changed =
          section.id === "machines"
            ? moneyDirty.machines || moneyDirty.labour
            : moneyDirty[section.id];
        return (
          <Link
            key={section.id}
            href={section.href}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-body-sm font-medium ${
              active
                ? "bg-primary text-on-primary"
                : "bg-surface-lowest text-on-surface-variant hover:bg-surface-low"
            }`}
          >
            {changed ? (
              <span
                className="impact-dirty-light"
                aria-label="Changed"
                title="Changed vs baseline"
              />
            ) : null}
            {section.label}
            {changed ? (
              <span className="sr-only"> (changed)</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
