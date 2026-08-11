"use client";

import Link from "next/link";
import { Factory, Settings, Sparkles, Zap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "motion/react";
import { PRODUCT_NAME } from "@/lib/brand";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { PageMotion } from "@/components/motion/PageMotion";
import { EASE } from "@/components/motion/motion-kit";

const primaryNav = [
  { href: "/factory", label: "Factory", icon: Factory },
  { href: "/impact", label: "Impact", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings },
];

const HIDDEN_ROUTE_PREFIXES = [
  "/dashboard",
  "/urgent",
  "/parts",
  "/customers",
  "/baselines",
  "/capacity",
];

function isOnboardingPath(pathname: string) {
  return (
    pathname.startsWith("/welcome") ||
    pathname.startsWith("/tour") ||
    pathname.startsWith("/setup") ||
    pathname === "/"
  );
}

function navActive(pathname: string, href: string) {
  if (href === "/factory") return pathname.startsWith("/factory");
  if (href === "/impact") return pathname.startsWith("/impact");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isHiddenProductPath(pathname: string) {
  return HIDDEN_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** Phase 1 shell — Factory Pulse + Impact Lab only. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, onboarded, record, resetClient } = useV2Graph();
  const onboarding = isOnboardingPath(pathname);

  useEffect(() => {
    if (!ready || onboarding || onboarded) return;
    router.replace("/welcome");
  }, [ready, onboarding, onboarded, router]);

  useEffect(() => {
    if (!ready || !onboarded || onboarding) return;
    if (isHiddenProductPath(pathname)) {
      router.replace("/factory");
    }
  }, [ready, onboarded, onboarding, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-body-sm text-on-surface-variant">
        Preparing your workspace…
      </div>
    );
  }

  if (onboarding) {
    return <PageMotion>{children}</PageMotion>;
  }

  if (!onboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-body-sm text-on-surface-variant">
        Redirecting to onboarding…
      </div>
    );
  }

  if (isHiddenProductPath(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-body-sm text-on-surface-variant">
        Opening your factory…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-sidebar flex-col border-r border-outline-variant/40 bg-surface-lowest">
        <div className="mb-2 border-b border-outline-variant/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
              <Sparkles className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-headline-sm font-bold tracking-tight text-on-surface">
                {PRODUCT_NAME}
              </h1>
              <p className="truncate text-[11px] text-on-surface-variant">
                {record.plant.name || "Your plant"}
              </p>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
          {primaryNav.map((item) => {
            const active = navActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`press relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-body-md font-medium transition-colors duration-150 ${
                  active
                    ? "text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ duration: 0.28, ease: EASE }}
                    className="absolute inset-0 rounded-lg bg-primary/10"
                  />
                ) : null}
                <Icon
                  className="relative z-10 h-[18px] w-[18px]"
                  strokeWidth={1.8}
                />
                <span className="relative z-10 flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-outline-variant/50 p-4">
          <button
            type="button"
            onClick={() => {
              resetClient();
              router.push("/welcome");
            }}
            className="press w-full cursor-pointer rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-sm text-on-surface-variant transition-colors hover:border-primary/30 hover:text-on-surface"
          >
            Reset &amp; re-onboard
          </button>
        </div>
      </aside>
      <header className="fixed left-sidebar right-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-outline-variant bg-surface-lowest/90 px-4 backdrop-blur-md">
        <p className="text-headline-sm font-bold tracking-tight text-on-surface">
          {record.plant.name}
        </p>
      </header>
      <main className="ml-sidebar min-h-screen pt-14">
        <PageMotion>{children}</PageMotion>
      </main>
    </div>
  );
}

/** @deprecated Use AppShell — kept so older imports keep working. */
export { AppShell as V2Shell };
