import Link from "next/link";
import { Factory } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[42%] flex-col justify-between bg-on-secondary-fixed p-10 text-on-primary lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary">
            <Factory className="h-5 w-5" />
          </div>
          <div>
            <p className="text-headline-sm font-bold">Part Management</p>
            <p className="text-body-sm text-secondary-fixed-dim">Industrial Enterprise</p>
          </div>
        </div>
        <div>
          <h1 className="text-headline-lg max-w-sm">
            Cycle time, cost, and process truth — in one place.
          </h1>
          <p className="mt-4 max-w-sm text-body-md text-secondary-fixed-dim">
            Track estimated vs actual MHR-driven costs across CNC and VMC
            processes. Prototype UI with dummy data for partner review.
          </p>
        </div>
        <p className="font-mono text-code-sm text-secondary-fixed-dim">
          Mumbai West Plant · UI preview
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-sm rounded border border-outline-variant bg-surface-lowest p-8 shadow-industrial">
          <h2 className="text-headline-md text-on-surface">Sign in</h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Local preview — any credentials work.
          </p>
          <form className="mt-6 space-y-4" action="/dashboard">
            <label className="block">
              <span className="label-caps mb-1 block text-on-surface-variant">Email</span>
              <input
                type="email"
                defaultValue="ravi@plant.local"
                className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-body-md focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="label-caps mb-1 block text-on-surface-variant">Password</span>
              <input
                type="password"
                defaultValue="••••••••"
                className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-body-md focus:border-primary"
              />
            </label>
            <Link
              href="/dashboard"
              className="flex w-full cursor-pointer items-center justify-center rounded-sm bg-primary px-4 py-2.5 text-body-sm font-medium text-on-primary transition-colors hover:bg-primary/90"
            >
              Continue to dashboard
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
