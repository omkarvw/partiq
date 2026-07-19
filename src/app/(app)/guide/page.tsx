import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Factory,
  Handshake,
  IndianRupee,
  MessagesSquare,
  ScrollText,
  Users,
} from "lucide-react";
import { Button, Panel } from "@/components/ui/Primitives";

const FLOW_STEPS = [
  {
    n: 1,
    title: "Customers (master data)",
    body: "Maintain OEMs and internal cost centers once. Parts and RFQs pick from this list so names, contacts, and terms stay consistent.",
    href: "/customers",
    cta: "Open customers",
    icon: Users,
  },
  {
    n: 2,
    title: "Create a part",
    body: "Register the part code, material, and customer. The part is the hub for commercial activity and later shopfloor costing.",
    href: "/parts",
    cta: "Open parts",
    icon: Factory,
  },
  {
    n: 3,
    title: "Record enquiries (RFQs)",
    body: "When a customer asks for pricing, log an enquiry on that part: quantity, needed-by, quote-by, notes, and any custom fields (drawing rev, finish, etc.).",
    href: "/parts/part-brk-118/commercial",
    cta: "See commercial hub",
    icon: ClipboardList,
  },
  {
    n: 4,
    title: "Issue quotations",
    body: "From an enquiry, create one or more quotes: unit price, lead time, validity, terms. Optional process-cost basis helps you see margin context.",
    href: "/parts/part-brk-118/commercial",
    cta: "View sample quotes",
    icon: ScrollText,
  },
  {
    n: 5,
    title: "Log customer responses",
    body: "Capture accept, reject, negotiate, or no response against a quote — including counter-price and revised quantity when they push back.",
    href: "/parts/part-brk-118/commercial",
    cta: "View sample replies",
    icon: MessagesSquare,
  },
  {
    n: 6,
    title: "Process flow & costing",
    body: "After the job is won (or while engineering develops), define process steps, MHR, estimated/actual time, custom fields, and files. Dashboard signals flag overruns.",
    href: "/parts/part-mid-3060",
    cta: "Open production part",
    icon: IndianRupee,
  },
] as const;

export default function GuidePage() {
  return (
    <div className="p-8">
      <div className="mb-8 max-w-3xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-sm bg-primary/10 px-2 py-1 text-primary">
          <BookOpen className="h-4 w-4" />
          <span className="label-caps">Product guide</span>
        </div>
        <h2 className="text-headline-lg text-on-surface">How PartIq works</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">
          PartIq connects commercial quoting to shopfloor process costing. Use this
          screen when walking a new user or customer through the product — follow the
          numbered flow below, then explore the live demo data.
        </p>
      </div>

      <Panel title="End-to-end flow" className="mb-8">
        <div className="overflow-x-auto p-4">
          <ol className="flex min-w-[720px] items-stretch gap-2">
            {[
              "Customer",
              "Part",
              "RFQ",
              "Quote",
              "Response",
              "Process & cost",
            ].map((label, i, arr) => (
              <li key={label} className="flex flex-1 items-center gap-2">
                <div className="flex flex-1 flex-col items-center rounded border border-outline-variant bg-surface-low px-2 py-3 text-center">
                  <span className="font-mono text-code-sm text-primary">{i + 1}</span>
                  <span className="mt-1 text-body-sm font-medium text-on-surface">
                    {label}
                  </span>
                </div>
                {i < arr.length - 1 ? (
                  <ArrowRight className="h-4 w-4 shrink-0 text-outline" />
                ) : null}
              </li>
            ))}
          </ol>
        </div>
        <p className="border-t border-outline-variant px-4 py-3 text-body-sm text-on-surface-variant">
          Commercial steps come first. Process steps and MHR costing are filled during
          development / production — they are not required to log an RFQ or send a quote.
        </p>
      </Panel>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {FLOW_STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <section
              key={step.n}
              className="rounded border border-outline-variant bg-surface-lowest p-5"
            >
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary text-on-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="label-caps text-on-surface-variant">Step {step.n}</p>
                  <h3 className="text-headline-sm text-on-surface">{step.title}</h3>
                </div>
              </div>
              <p className="mb-4 text-body-sm text-on-surface-variant">{step.body}</p>
              <Link href={step.href}>
                <Button variant="secondary">
                  {step.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </section>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Custom fields">
          <p className="p-4 text-body-sm text-on-surface-variant">
            Customers, enquiries, quotations, responses, and process versions all support
            extra label/value fields. Use them for GSTIN, drawing rev, tooling, payment
            overrides — without changing the core schema.
          </p>
        </Panel>
        <Panel title="Dashboard">
          <p className="p-4 text-body-sm text-on-surface-variant">
            Plant overview shows process cost variance plus a commercial pipeline: totals
            and stage counts for parts, RFQs, quotations, and customer responses.
          </p>
          <div className="border-t border-outline-variant px-4 py-3">
            <Link href="/dashboard">
              <Button variant="secondary">
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Panel>
        <Panel title="Suggested demo path">
          <ol className="list-decimal space-y-2 p-4 pl-8 text-body-sm text-on-surface-variant">
            <li>
              Open{" "}
              <Link href="/customers/cust-autoforge" className="text-primary hover:underline">
                AutoForge Pvt
              </Link>
            </li>
            <li>
              Then part{" "}
              <Link href="/parts/part-brk-118" className="text-primary hover:underline">
                BRK-118
              </Link>{" "}
              → Commercial
            </li>
            <li>
              Walk enquiry → quote → response, then open{" "}
              <Link href="/parts/part-mid-3060" className="text-primary hover:underline">
                MID-3060
              </Link>{" "}
              for process costing
            </li>
          </ol>
        </Panel>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded border border-primary/20 bg-primary/5 px-4 py-4">
        <Handshake className="h-5 w-5 text-primary" />
        <p className="flex-1 text-body-sm text-on-surface">
          This prototype uses seed data only — create forms demonstrate the UX but do not
          persist yet.
        </p>
        <Link href="/parts/part-brk-118/commercial">
          <Button>
            Start with BRK-118 commercial
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
