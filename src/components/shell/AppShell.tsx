"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  Settings,
  History,
  Search,
  Bell,
  HelpCircle,
  Building2,
} from "lucide-react";
import { ORG_LABEL, PLANT_NAME } from "@/lib/data";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parts", label: "Parts", icon: Factory },
  { href: "/parts/part-mid-3060/processes/proc-cnc-1/audit", label: "Audit Log", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-on-background">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-sidebar flex-col bg-on-secondary-fixed">
        <div className="mb-4 flex items-center gap-3 border-b border-on-secondary-fixed-variant/40 p-4 pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-on-primary">
            <Factory className="h-[18px] w-[18px]" />
          </div>
          <div>
            <h1 className="text-headline-sm font-bold leading-tight text-on-primary">
              Part Management
            </h1>
            <p className="text-[11px] text-secondary-fixed-dim">Industrial Enterprise</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2">
          {nav.map((item) => {
            const active =
              item.href === "/parts"
                ? pathname.startsWith("/parts") && !pathname.includes("/audit")
                : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-r px-3 py-2 transition-colors duration-150 ${
                  active
                    ? "border-l-[3px] border-primary-container bg-secondary-container/10 text-on-primary"
                    : "border-l-[3px] border-transparent text-secondary-fixed-dim hover:bg-white/5 hover:text-on-primary"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-body-md font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <div className="flex items-center gap-2 rounded-sm border border-white/10 bg-white/5 px-2 py-2">
            <Building2 className="h-4 w-4 text-secondary-fixed-dim" />
            <span className="truncate font-mono text-code-sm text-secondary-fixed-dim">
              {ORG_LABEL}
            </span>
          </div>
        </div>
      </aside>

      <header className="fixed left-sidebar right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-outline-variant bg-surface-lowest px-4">
        <div className="flex items-center gap-4">
          <span className="text-headline-sm font-bold tracking-tight text-on-surface">
            {PLANT_NAME}
          </span>
          <div className="relative hidden md:block">
            <Search className="absolute left-2 top-1.5 h-[18px] w-[18px] text-on-surface-variant" />
            <input
              type="search"
              placeholder="Search parts, programs..."
              className="w-64 rounded-sm border border-outline-variant bg-surface-low py-1.5 pl-8 pr-3 text-body-sm placeholder:text-on-surface-variant focus:border-primary"
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Notifications"
            className="cursor-pointer rounded-sm p-1.5 text-on-surface-variant transition-colors hover:bg-surface-high"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Help"
            className="cursor-pointer rounded-sm p-1.5 text-on-surface-variant transition-colors hover:bg-surface-high"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant bg-primary-container text-code-sm font-bold text-on-primary">
            R
          </div>
        </div>
      </header>

      <main className="ml-sidebar min-h-screen pt-14">{children}</main>
    </div>
  );
}
