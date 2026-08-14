"use client";

import { useCallback, useState } from "react";
import {
  ApplyMachineScopeDialog,
  type MachineApplyScope,
} from "@/components/v2/ApplyMachineScopeDialog";

type Pending = {
  title: string;
  body: string;
  machineName: string;
  machineType: string;
  typeCount: number;
  allowMachineOnly?: boolean;
  apply: (scope: MachineApplyScope) => void;
};

/**
 * Confirm before structural add/remove on a machine.
 * Skips the dialog when only one machine of that type exists and machine-only is allowed.
 */
export function useApplyMachineStructure() {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirmStructure = useCallback((opts: Pending) => {
    const allowMachineOnly = opts.allowMachineOnly !== false;
    if (allowMachineOnly && opts.typeCount <= 1) {
      opts.apply("machine");
      return;
    }
    if (!allowMachineOnly && opts.typeCount <= 1) {
      opts.apply("type");
      return;
    }
    setPending(opts);
  }, []);

  const dialog = (
    <ApplyMachineScopeDialog
      open={Boolean(pending)}
      title={pending?.title ?? ""}
      body={pending?.body ?? ""}
      machineName={pending?.machineName ?? ""}
      machineType={pending?.machineType ?? ""}
      typeCount={pending?.typeCount ?? 0}
      allowMachineOnly={pending?.allowMachineOnly !== false}
      onChoose={(scope) => {
        pending?.apply(scope);
        setPending(null);
      }}
      onClose={() => setPending(null)}
    />
  );

  return { confirmStructure, dialog };
}
