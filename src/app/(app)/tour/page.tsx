"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Factory,
  GitCompare,
  LayoutDashboard,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import {
  StepProgress,
  V2PrimaryButton,
  V2SecondaryButton,
} from "@/components/v2/V2Ui";

const SLIDES = [
  {
    id: "factory",
    icon: Factory,
    title: "Factory Pulse",
    body: "See where plant money goes — labour, utilities, overhead, EMI, tooling — then browse machines by sections you name (shopfloor, customer, or anything).",
    tags: ["Plant cost", "Cash MHR", "Sections"],
  },
  {
    id: "mhr",
    icon: LayoutDashboard,
    title: "Machine hour rate",
    body: "Cash MHR is calculated machine-by-machine: calendar, EMI, labour, utility, maintenance, tooling — plus factory overhead allocated across machines.",
    tags: ["₹/hr breakup", "Explainable", "Excel-aligned"],
  },
  {
    id: "impact",
    icon: Zap,
    title: "Master data",
    body: "Try adding machines for a prospect or changing power/wages. See insights immediately — without touching your live factory.",
    tags: ["What-if", "Add machines", "No fear"],
  },
  {
    id: "save",
    icon: GitCompare,
    title: "Save or make live",
    body: "Discard, save a named what-if, or make the exploration your live factory only when you decide.",
    tags: ["Save what-if", "Make live", "Discard"],
  },
  {
    id: "trust",
    icon: ShieldCheck,
    title: "Your operating truth",
    body: "Live Pulse always shows the adopted plant. Explorations never silently overwrite it.",
    tags: ["Live vs exploring", "Clear modes", "Trust"],
  },
] as const;

export default function TourPage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { markTourSeen, setStep, onboarded } = useV2Graph();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const Icon = slide.icon;

  useEffect(() => {
    if (onboarded) router.replace("/factory");
  }, [onboarded, router]);

  function finish() {
    markTourSeen();
    setStep("plant");
    router.push("/setup");
  }

  if (onboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-body-sm text-on-surface-variant">
        Opening your factory…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbfd_0%,#eef4ff_100%)] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <StepProgress
          step={index + 1}
          total={SLIDES.length}
          label="Product walkthrough"
        />

        <div className="relative min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.article
              key={slide.id}
              initial={reduced ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: -18 }}
              transition={{ duration: reduced ? 0 : 0.28 }}
              className="rounded-2xl border border-outline-variant bg-surface-lowest p-8 shadow-industrial sm:p-10"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-on-primary">
                <Icon className="h-6 w-6" />
              </div>
              <p className="label-caps text-primary">
                {index + 1} of {SLIDES.length}
              </p>
              <h1 className="mt-2 text-headline-lg text-on-surface">
                {slide.title}
              </h1>
              <p className="mt-4 max-w-2xl text-body-md leading-7 text-on-surface-variant">
                {slide.body}
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {slide.tags.map((tag) => (
                  <div
                    key={tag}
                    className="rounded-lg border border-outline-variant/70 bg-surface-low px-3 py-3 text-body-sm font-medium text-on-surface"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </motion.article>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <V2SecondaryButton
            onClick={() => {
              if (index === 0) router.push("/welcome");
              else setIndex((value) => value - 1);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </V2SecondaryButton>
          {index < SLIDES.length - 1 ? (
            <V2PrimaryButton onClick={() => setIndex((value) => value + 1)}>
              Next
              <ArrowRight className="h-4 w-4" />
            </V2PrimaryButton>
          ) : (
            <V2PrimaryButton onClick={finish}>
              Continue to plant setup
              <ArrowRight className="h-4 w-4" />
            </V2PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
