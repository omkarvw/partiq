import type { V2MachineDraft } from "@/lib/v2/clientDb";

/** Legacy DemoGraph / seed IDs → preferred machine type on the live plant. */
const LEGACY_TYPE: Record<string, string> = {
  "mch-brother-vmc": "VMC",
  "mch-cnc-lathe": "CNC Lathe",
  "example-vmc-1": "VMC",
  "example-cnc-1": "CNC Lathe",
};

/**
 * Map a process-version machineId (legacy or live) onto a machine in the
 * current plant record. Prefers exact id, then type match, then first machine.
 */
export function resolvePlantMachineId(
  machineId: string | undefined,
  machines: Pick<V2MachineDraft, "id" | "type" | "name">[],
): string | undefined {
  if (!machines.length) return undefined;
  if (!machineId) return machines[0]?.id;

  if (machines.some((m) => m.id === machineId)) return machineId;

  const typeHint = LEGACY_TYPE[machineId];
  if (typeHint) {
    const byType = machines.find(
      (m) => m.type.toLowerCase() === typeHint.toLowerCase(),
    );
    if (byType) return byType.id;
  }

  const lowered = machineId.toLowerCase();
  const fuzzy = machines.find((m) => {
    const t = m.type.toLowerCase();
    return (
      (t.includes("vmc") && lowered.includes("vmc")) ||
      (t.includes("lathe") && lowered.includes("lathe"))
    );
  });
  if (fuzzy) return fuzzy.id;

  return machines[0]?.id;
}
