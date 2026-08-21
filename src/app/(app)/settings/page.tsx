"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import {
  V2Field,
  V2Input,
  V2PrimaryButton,
  V2SecondaryButton,
} from "@/components/v2/V2Ui";
import { V2_STORAGE_KEY } from "@/lib/v2/clientDb";
import { ConfirmDialog } from "@/components/plant/ConfirmDialog";
import {
  enableClassicSeedDemo,
  getCommercialMode,
  startGuidedStorySession,
} from "@/lib/commercial/entityStore";
import {
  readSessionActor,
  writeSessionActor,
} from "@/lib/v2/sessionActor";

export default function V2SettingsPage() {
  const router = useRouter();
  const { record, resetClient, reopenSetup } = useV2Graph();
  const [wipeOpen, setWipeOpen] = useState(false);
  const [catalogMode, setCatalogMode] = useState(getCommercialMode);
  const initialActor = readSessionActor();
  const [actorName, setActorName] = useState(initialActor.name);
  const [actorEmail, setActorEmail] = useState(initialActor.email);
  const [actorSaved, setActorSaved] = useState(false);

  return (
    <div className="p-4 sm:p-8">
      <h2 className="text-headline-lg text-on-surface">Settings</h2>
      <p className="mt-1 max-w-2xl text-body-md text-on-surface-variant">
        Plant data stays on this computer as{" "}
        <code className="font-mono text-code-sm">{V2_STORAGE_KEY}</code>.
      </p>

      <div className="mt-6 max-w-xl space-y-5 rounded-lg border border-outline-variant bg-surface-lowest p-4 sm:p-5">
        <div>
          <p className="label-caps text-on-surface-variant">Audit actor</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Master data commits (make live / save what-if / discard) are tagged with
            this name. There is no real login yet.
          </p>
          <div className="mt-3 space-y-3">
            <V2Field label="Name">
              <V2Input
                value={actorName}
                onChange={(e) => {
                  setActorName(e.target.value);
                  setActorSaved(false);
                }}
              />
            </V2Field>
            <V2Field label="Email">
              <V2Input
                type="email"
                value={actorEmail}
                onChange={(e) => {
                  setActorEmail(e.target.value);
                  setActorSaved(false);
                }}
              />
            </V2Field>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <V2SecondaryButton
              onClick={() => {
                writeSessionActor({ name: actorName, email: actorEmail });
                setActorSaved(true);
              }}
            >
              Save actor
            </V2SecondaryButton>
            <Link
              href="/master-data/audit"
              className="text-body-sm font-medium text-primary hover:underline"
            >
              Open Master data audit
            </Link>
            {actorSaved ? (
              <span className="text-body-sm text-on-surface-variant">
                Saved on this computer
              </span>
            ) : null}
          </div>
        </div>
        <div>
          <p className="label-caps text-on-surface-variant">Plant</p>
          <p className="text-body-md text-on-surface">{record.plant.name}</p>
        </div>
        <div>
          <p className="label-caps text-on-surface-variant">Target profit</p>
          <p className="text-body-md text-on-surface">
            {(record.plant.targetGrossMarginPct ?? 20).toFixed(1)}%{" "}
            <Link
              href="/master-data/plant"
              className="ml-2 text-body-sm font-medium text-primary hover:underline"
            >
              Edit in Master data
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
              href="/master-data/machines"
              className="font-medium text-primary hover:underline"
            >
              Master data → Machines
            </Link>
            .
          </p>
        </div>
        <div>
          <p className="label-caps text-on-surface-variant">Parts & quotes</p>
          <p className="text-body-md text-on-surface">
            {catalogMode === "seed" ? "Demo catalog" : "Empty catalog"}
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Demo catalog shows sample customers, parts, G-code, and quotes
            priced against your live factory MHR. Empty catalog is for creating
            your own.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <V2SecondaryButton
              onClick={() => {
                enableClassicSeedDemo();
                setCatalogMode("seed");
              }}
            >
              Show demo catalog
            </V2SecondaryButton>
            <V2SecondaryButton
              onClick={() => {
                startGuidedStorySession();
                setCatalogMode("story");
              }}
            >
              Start empty catalog
            </V2SecondaryButton>
          </div>
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
