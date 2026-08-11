"use client";

import Link from "next/link";
import { Factory, Sparkles } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/brand";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[46%] overflow-hidden bg-on-secondary-fixed p-10 text-on-primary lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute -left-16 top-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-secondary-fixed/20 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary">
            <Factory className="h-5 w-5" />
          </div>
          <div>
            <p className="text-headline-sm font-bold">{PRODUCT_NAME}</p>
            <p className="text-body-sm text-secondary-fixed-dim">
              Machine hour rate · Decisions
            </p>
          </div>
        </div>
        <div className="relative">
          <p className="label-caps text-primary-fixed">Plant workspace</p>
          <h1 className="mt-3 max-w-md text-headline-lg">
            One plant model for cost, capacity, and part quotes.
          </h1>
          <p className="mt-4 max-w-md text-body-md text-secondary-fixed-dim">
            Set up your factory once. Decision, Impact, and Parts all use the
            same Cash MHR.
          </p>
        </div>
        <p className="relative font-mono text-code-sm text-secondary-fixed-dim">
          Local preview · any credentials work
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-lowest p-8 shadow-industrial">
          <div className="mb-6 flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="label-caps">Sign in</span>
          </div>
          <h2 className="text-headline-md text-on-surface">Welcome</h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Continue into your plant workspace.
          </p>

          <form className="mt-6 space-y-4">
            <label className="block">
              <span className="label-caps mb-1 block text-on-surface-variant">
                Email
              </span>
              <input
                type="email"
                defaultValue="ops@yourplant.com"
                className="min-h-11 w-full rounded-sm border border-outline-variant bg-surface px-3 text-body-md focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="label-caps mb-1 block text-on-surface-variant">
                Password
              </span>
              <input
                type="password"
                defaultValue="••••••••"
                className="min-h-11 w-full rounded-sm border border-outline-variant bg-surface px-3 text-body-md focus:border-primary"
              />
            </label>
          </form>

          <div className="mt-6">
            <Link
              href="/welcome"
              className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-sm bg-primary px-4 text-body-sm font-medium text-on-primary transition-colors hover:bg-primary/90"
            >
              Continue to workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
