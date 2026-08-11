"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { PulseLottie } from "@/components/v2/PulseLottie";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import {
  StoryPanel,
  V2PrimaryButton,
  V2SecondaryButton,
} from "@/components/v2/V2Ui";

export default function WelcomePage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { setStep, onboarded } = useV2Graph();

  useEffect(() => {
    if (onboarded) router.replace("/factory");
  }, [onboarded, router]);

  if (onboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-body-sm text-on-surface-variant">
        Opening your factory…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e8f7f4,transparent_42%),radial-gradient(circle_at_bottom_right,#eef4ff,transparent_40%),#f7fafc]">
      <div className="mx-auto grid max-w-6xl items-stretch gap-8 px-6 py-12 lg:grid-cols-2 lg:py-16">
        <StoryPanel
          eyebrow="Welcome to PartIq"
          title="See your whole factory’s money in one place."
          body="Enter plant costs once. Watch labour, utilities, overhead, and machine hour rates come alive. Try what-ifs — even new machines for a prospect — without touching your live factory until you say so."
        >
          <div className="flex flex-wrap gap-3">
            <V2PrimaryButton
              onClick={() => {
                setStep("tour");
                router.push("/tour");
              }}
            >
              Start walkthrough
              <ArrowRight className="h-4 w-4" />
            </V2PrimaryButton>
            <V2SecondaryButton
              onClick={() => {
                setStep("plant");
                router.push("/setup");
              }}
            >
              Skip to plant setup
            </V2SecondaryButton>
          </div>
          <p className="mt-6 text-body-sm text-on-surface-variant">
            Looking for your live factory?{" "}
            <Link href="/factory" className="text-primary hover:underline">
              Open Factory Pulse
            </Link>
          </p>
        </StoryPanel>

        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.4 }}
          className="flex flex-col overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-lowest shadow-industrial"
        >
          <div className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-primary/10 via-white to-secondary-container/30 p-8">
            <PulseLottie className="h-56 w-56 sm:h-64 sm:w-64" />
          </div>
          <div className="border-t border-outline-variant/70 bg-white/90 px-5 py-4">
            <p className="label-caps text-primary">First session promise</p>
            <p className="mt-1 text-body-sm text-on-surface">
              Explain → Capture plant → Derive Cash MHR → Land on your
              dashboard.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
