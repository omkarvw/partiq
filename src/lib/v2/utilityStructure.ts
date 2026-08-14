import {
  cloneUtilityLine,
  defaultUtilityLines,
  syncMachineUtilityAnnual,
  type V2MachineDraft,
  type V2UtilityLine,
} from "@/lib/v2/clientDb";
import type { MachineApplyScope } from "@/components/v2/ApplyMachineScopeDialog";

function linesOf(m: V2MachineDraft): V2UtilityLine[] {
  return m.utilityLines?.length ? m.utilityLines : defaultUtilityLines();
}

function sameLineSlot(a: V2UtilityLine, b: V2UtilityLine) {
  return (
    a.id === b.id ||
    (a.name.trim().toLowerCase() === b.name.trim().toLowerCase() &&
      a.mode === b.mode)
  );
}

/** Apply add custom utility to one machine or all of its type. */
export function machinesAfterUtilityAdd(
  machines: V2MachineDraft[],
  focusId: string,
  line: V2UtilityLine,
  scope: MachineApplyScope,
): V2MachineDraft[] {
  const focus = machines.find((m) => m.id === focusId);
  if (!focus) return machines;
  const type = focus.type;

  return machines.map((m) => {
    if (m.id === focusId) {
      return syncMachineUtilityAnnual({
        ...m,
        utilityLines: [...linesOf(m), line],
      });
    }
    if (scope === "type" && m.type === type) {
      return syncMachineUtilityAnnual({
        ...m,
        utilityLines: [...linesOf(m), cloneUtilityLine(line)],
      });
    }
    return m;
  });
}

/** Apply remove utility line to one machine or all of its type. */
export function machinesAfterUtilityRemove(
  machines: V2MachineDraft[],
  focusId: string,
  line: V2UtilityLine,
  scope: MachineApplyScope,
): V2MachineDraft[] {
  const focus = machines.find((m) => m.id === focusId);
  if (!focus) return machines;
  const type = focus.type;

  return machines.map((m) => {
    if (m.id === focusId) {
      return syncMachineUtilityAnnual({
        ...m,
        utilityLines: linesOf(m).filter((l) => l.id !== line.id),
      });
    }
    if (scope === "type" && m.type === type) {
      return syncMachineUtilityAnnual({
        ...m,
        utilityLines: linesOf(m).filter((l) => !sameLineSlot(l, line)),
      });
    }
    return m;
  });
}
