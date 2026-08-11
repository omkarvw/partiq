"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { V2PrimaryButton, V2SecondaryButton } from "@/components/v2/V2Ui";
import { V2_STORAGE_KEY } from "@/lib/v2/clientDb";
import { ConfirmDialog } from "@/components/plant/ConfirmDialog";

export default function V2SettingsPage() {
  const router = useRouter();
  const { record, resetClient, reopenSetup } = useV2Graph();
  const [wipeOpen, setWipeOpen] = useState(false);

  return (
    <div className="p-4 sm:p-8">
      <h2 className="text-headline-lg text-on-surface">Settings</h2>
      <p className="mt-1 max-w-2xl text-body-md text-on-surface-variant">
        Plant data stays on this computer as{" "}
        <code className="font-mono text-code-sm">{V2_STORAGE_KEY}</code>.
      </p>

      <div className="mt-6 max-w-xl space-y-4 rounded-2xl border border-outline-variant bg-surface-lowest p-5">
        <div>
          <p className="label-caps text-on-surface-variant">Plant</p>
          <p className="text-body-md text-on-surface">{record.plant.name}</p>
        </div>
        <div>
          <p className="label-caps text-on-surface-variant">Target profit</p>
          <p className="text-body-md text-on-surface">
            {(record.plant.targetGrossMarginPct ?? 20).toFixed(1)}%{" "}
            <Link
              href="/impact/plant"
              className="ml-2 text-body-sm font-medium text-primary hover:underline"
            >
              Edit in Impact
            </Link>
          </p>
        </div>
        <div>
          <p className="label-caps text-on-surface-variant">Machines</p>
          <p className="text-body-md text-on-surface">
            {record.machines.length}
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Add or remove from{" "}
            <Link
              href="/factory"
              className="font-medium text-primary hover:underline"
            >
              Factory
            </Link>{" "}
            or{" "}
            <Link
              href="/impact/machines"
              className="font-medium text-primary hover:underline"
            >
              Impact → Machines
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <V2SecondaryButton
            onClick={() => {
              reopenSetup();
              router.push("/setup");
            }}
          >
            Edit setup again
          </V2SecondaryButton>
          <V2PrimaryButton onClick={() => setWipeOpen(true)}>
            Wipe local data &amp; re-onboard
          </V2PrimaryButton>
        </div>
      </div>
      <ConfirmDialog
        open={wipeOpen}
        title="Wipe this plant?"
        body="All machines, costs, and what-ifs on this computer will be cleared. You will start onboarding again."
        confirmLabel="Wipe and re-onboard"
        tone="danger"
        onClose={() => setWipeOpen(false)}
        onConfirm={() => {
          resetClient();
          router.push("/welcome");
        }}
      />
    </div>
  );
}
