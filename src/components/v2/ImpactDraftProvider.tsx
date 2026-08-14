"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import {
  computeAllMachines,
  computePlantKpis,
} from "@/lib/factory/calcEngine";
import type { MhrBreakup, PlantKpis } from "@/lib/factory/types";
import {
  clientRecordFromSnapshot,
  createEmptyMachine,
  defaultLabourRoles,
  defaultToolingLines,
  snapshotFromRecord,
  syncMachineUtilityAnnual,
  toFactoryInputs,
  toMachineInputs,
  type ImpactSectionId,
  type V2BaselineSnapshot,
  type V2LabourRole,
  type V2MachineDraft,
  type V2OhLine,
  type V2PlantDraft,
  type V2Statutory,
  type V2ToolingLine,
} from "@/lib/v2/clientDb";
import { anyDirty, dirtyCount, dirtySections, moneyDirtySections } from "@/lib/v2/impactDirty";

type ImpactDraftValue = {
  baselineSnap: V2BaselineSnapshot;
  draft: V2BaselineSnapshot;
  dirty: Record<ImpactSectionId, boolean>;
  dirtyTotal: number;
  /** Yellow lights / cost-area strip — excludes section moves that don’t change ₹/hr. */
  moneyDirty: Record<ImpactSectionId, boolean>;
  moneyDirtyTotal: number;
  isDirty: boolean;
  focusMachineId: string;
  setFocusMachineId: (id: string) => void;
  focusType: string;
  setFocusType: (type: string) => void;
  applyScope: "machine" | "type";
  setApplyScope: (scope: "machine" | "type") => void;
  draftBreakups: Record<string, MhrBreakup>;
  draftPlantKpis: PlantKpis | null;
  liveBreakups: Record<string, MhrBreakup>;
  patchPlant: (partial: Partial<V2PlantDraft>) => void;
  patchUtilities: (rate: number) => void;
  upsertDraftMachine: (m: V2MachineDraft) => void;
  /** Replace the full draft machine list (e.g. utility structure applied to a type). */
  replaceDraftMachines: (machines: V2MachineDraft[]) => void;
  addDraftMachine: (
    type?: string,
    sectionId?: string | null,
    name?: string,
    extras?: Partial<V2MachineDraft>,
  ) => V2MachineDraft;
  removeDraftMachine: (id: string) => void;
  setLabourForType: (type: string, roles: V2LabourRole[]) => void;
  patchFocusedMachines: (patch: Partial<V2MachineDraft>) => void;
  upsertLabourRole: (type: string, role: V2LabourRole) => void;
  removeLabourRole: (type: string, id: string) => void;
  setStatutory: (patch: Partial<V2Statutory>) => void;
  upsertOverheadLine: (line: V2OhLine) => void;
  removeOverheadLine: (id: string) => void;
  upsertToolingLine: (type: string, line: V2ToolingLine) => void;
  removeToolingLine: (type: string, id: string) => void;
  discard: () => void;
  adoptAsBaseline: (name?: string, note?: string) => void;
  saveAsScenario: (name: string, note?: string) => void;
  loadScenario: (id: string) => boolean;
  /** Re-seed draft from live plant (only when clean, or force). */
  syncFromLive: (force?: boolean) => void;
};

const ImpactDraftContext = createContext<ImpactDraftValue | null>(null);

function emptyKpis(): PlantKpis {
  return {
    machineCount: 0,
    employees: 0,
    landSqFt: 0,
    blendedMhr: 0,
    capacityHours: 0,
    capacityValue: 0,
    annualMfgCost: 0,
    annualRevenue: 0,
    annualProfit: 0,
    underutilizationLoss: 0,
    electricityRate: 0,
    utilizationPct: 0,
    costCompositionAnnual: {
      emi: 0,
      labour: 0,
      utility: 0,
      utilityPower: 0,
      utilityOther: 0,
      maintenance: 0,
      overhead: 0,
      tooling: 0,
    },
  };
}

/**
 * Lives at V2 layout level so Impact sub-routes do not remount/reset the draft.
 */
export function ImpactDraftProvider({ children }: { children: ReactNode }) {
  const {
    record,
    breakups: liveBreakups,
    heroMachineId,
    adoptPlantSnapshot,
    saveScenario,
    onboarded,
  } = useV2Graph();

  const liveKey = record.updatedAt;
  const dirtyRef = useRef(false);
  const lastSyncedLiveKey = useRef<string | null>(null);

  const [baselineSnap, setBaselineSnap] = useState(() =>
    snapshotFromRecord(record),
  );
  const [draft, setDraft] = useState(() => snapshotFromRecord(record));
  const [focusType, setFocusType] = useState(
    () =>
      record.machines.find((m) => m.id === heroMachineId)?.type ??
      record.machines[0]?.type ??
      "",
  );
  const [focusMachineId, setFocusMachineId] = useState(
    () => heroMachineId ?? record.machines[0]?.id ?? "",
  );
  const [applyScope, setApplyScope] = useState<"machine" | "type">("machine");

  const dirty = useMemo(
    () => dirtySections(baselineSnap, draft),
    [baselineSnap, draft],
  );
  const moneyDirty = useMemo(
    () => moneyDirtySections(baselineSnap, draft),
    [baselineSnap, draft],
  );
  const isDirty = anyDirty(dirty);
  const dirtyTotal = dirtyCount(dirty);
  const moneyDirtyTotal = dirtyCount(moneyDirty);
  dirtyRef.current = isDirty;

  const syncFromLive = useCallback(
    (force = false) => {
      if (!force && dirtyRef.current) return;
      const live = snapshotFromRecord(record);
      setBaselineSnap(live);
      setDraft(live);
      lastSyncedLiveKey.current = record.updatedAt;
      const type =
        live.machines.find((m) => m.id === heroMachineId)?.type ??
        live.machines[0]?.type ??
        "";
      setFocusType((prev) => prev || type);
      setFocusMachineId(
        (prev) =>
          (prev && live.machines.some((m) => m.id === prev) ? prev : null) ??
          heroMachineId ??
          live.machines[0]?.id ??
          "",
      );
    },
    [record, heroMachineId],
  );

  // After onboarding / when live plant changes and draft is clean — re-sync.
  // Never wipe an in-progress dirty draft.
  useEffect(() => {
    if (!onboarded) return;
    if (lastSyncedLiveKey.current === null) {
      syncFromLive(true);
      return;
    }
    if (lastSyncedLiveKey.current !== liveKey && !dirtyRef.current) {
      syncFromLive(true);
    }
  }, [onboarded, liveKey, syncFromLive]);

  useEffect(() => {
    const types = Array.from(new Set(draft.machines.map((m) => m.type)));
    if (focusType && !types.includes(focusType) && types[0]) {
      setFocusType(types[0]);
    }
    const activeType =
      focusType && types.includes(focusType) ? focusType : types[0];
    const list = draft.machines.filter((m) => m.type === activeType);
    if (
      focusMachineId &&
      !draft.machines.some((m) => m.id === focusMachineId)
    ) {
      setFocusMachineId(list[0]?.id ?? draft.machines[0]?.id ?? "");
    }
  }, [draft.machines, focusType, focusMachineId]);

  const draftComputed = useMemo(() => {
    try {
      const fake = clientRecordFromSnapshot(draft);
      const factory = toFactoryInputs(fake.plant, fake);
      const machines = toMachineInputs(fake);
      const draftBreakups = computeAllMachines(factory, machines);
      const draftPlantKpis = computePlantKpis(factory, machines, draftBreakups);
      return { draftBreakups, draftPlantKpis };
    } catch {
      return {
        draftBreakups: {} as Record<string, MhrBreakup>,
        draftPlantKpis: emptyKpis() as PlantKpis,
      };
    }
  }, [draft]);

  const patchPlant = useCallback((partial: Partial<V2PlantDraft>) => {
    setDraft((prev) => ({
      ...prev,
      plant: { ...prev.plant, ...partial },
    }));
  }, []);

  const patchUtilities = useCallback((rate: number) => {
    setDraft((prev) => ({
      ...prev,
      plant: { ...prev.plant, electricityRatePerKwh: rate },
    }));
  }, []);

  const upsertDraftMachine = useCallback((m: V2MachineDraft) => {
    setDraft((prev) => {
      const exists = prev.machines.some((item) => item.id === m.id);
      const machines = exists
        ? prev.machines.map((item) => (item.id === m.id ? m : item))
        : [...prev.machines, m];
      return { ...prev, machines };
    });
  }, []);

  const replaceDraftMachines = useCallback((machines: V2MachineDraft[]) => {
    setDraft((prev) => ({ ...prev, machines }));
  }, []);

  const addDraftMachine = useCallback(
    (
      type = "VMC",
      sectionId: string | null = null,
      name?: string,
      extras?: Partial<V2MachineDraft>,
    ) => {
      let created = createEmptyMachine(1, type, sectionId);
      setDraft((prev) => {
        const count = prev.machines.filter((m) => m.type === type).length;
        const secId = sectionId ?? prev.sections[0]?.id ?? null;
        created = syncMachineUtilityAnnual({
          ...createEmptyMachine(count + 1, type, secId),
          ...extras,
          type,
          sectionId: secId,
          name: name?.trim() || extras?.name?.trim() || `${type} ${count + 1}`,
        });
        const labourByType = { ...prev.labourByType };
        if (!labourByType[type]?.length) {
          labourByType[type] = defaultLabourRoles();
        }
        const toolingProfiles = { ...prev.toolingProfiles };
        if (!toolingProfiles[type]?.length) {
          toolingProfiles[type] = defaultToolingLines();
        }
        const machineTypes = prev.machineTypes.includes(type)
          ? prev.machineTypes
          : [...prev.machineTypes, type];
        return {
          ...prev,
          machines: [...prev.machines, created],
          machineTypes,
          labourByType,
          toolingProfiles,
        };
      });
      setFocusType(type);
      setFocusMachineId(created.id);
      return created;
    },
    [],
  );

  const removeDraftMachine = useCallback((id: string) => {
    setDraft((prev) => {
      const removed = prev.machines.find((m) => m.id === id);
      const machines = prev.machines.filter((m) => m.id !== id);
      const sameType = machines.find((m) => m.type === removed?.type);
      const next = sameType ?? machines[0];
      if (next) {
        setFocusType(next.type);
        setFocusMachineId(next.id);
      } else {
        setFocusMachineId("");
      }
      return { ...prev, machines };
    });
  }, []);

  const patchFocusedMachines = useCallback(
    (patch: Partial<V2MachineDraft>) => {
      setDraft((prev) => ({
        ...prev,
        machines: prev.machines.map((m) => {
          const hit =
            applyScope === "type"
              ? m.type === focusType
              : m.id === focusMachineId;
          return hit ? { ...m, ...patch } : m;
        }),
      }));
    },
    [applyScope, focusType, focusMachineId],
  );

  const upsertLabourRole = useCallback((type: string, role: V2LabourRole) => {
    setDraft((prev) => {
      const list = prev.labourByType[type] ?? [];
      const exists = list.some((r) => r.id === role.id);
      const next = exists
        ? list.map((r) => (r.id === role.id ? role : r))
        : [...list, role];
      return {
        ...prev,
        labourByType: { ...prev.labourByType, [type]: next },
      };
    });
  }, []);

  const removeLabourRole = useCallback((type: string, id: string) => {
    setDraft((prev) => ({
      ...prev,
      labourByType: {
        ...prev.labourByType,
        [type]: (prev.labourByType[type] ?? []).filter((r) => r.id !== id),
      },
    }));
  }, []);

  const setLabourForType = useCallback((type: string, roles: V2LabourRole[]) => {
    setDraft((prev) => ({
      ...prev,
      labourByType: { ...prev.labourByType, [type]: roles },
    }));
  }, []);

  const setStatutory = useCallback((patch: Partial<V2Statutory>) => {
    setDraft((prev) => ({
      ...prev,
      statutory: { ...prev.statutory, ...patch },
    }));
  }, []);

  const upsertOverheadLine = useCallback((line: V2OhLine) => {
    setDraft((prev) => {
      const exists = prev.overheadLines.some((l) => l.id === line.id);
      return {
        ...prev,
        overheadLines: exists
          ? prev.overheadLines.map((l) => (l.id === line.id ? line : l))
          : [...prev.overheadLines, line],
      };
    });
  }, []);

  const removeOverheadLine = useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      overheadLines: prev.overheadLines.filter((l) => l.id !== id),
    }));
  }, []);

  const upsertToolingLine = useCallback((type: string, line: V2ToolingLine) => {
    setDraft((prev) => {
      const list = prev.toolingProfiles[type] ?? [];
      const exists = list.some((l) => l.id === line.id);
      const next = exists
        ? list.map((l) => (l.id === line.id ? line : l))
        : [...list, line];
      return {
        ...prev,
        toolingProfiles: { ...prev.toolingProfiles, [type]: next },
      };
    });
  }, []);

  const removeToolingLine = useCallback((type: string, id: string) => {
    setDraft((prev) => ({
      ...prev,
      toolingProfiles: {
        ...prev.toolingProfiles,
        [type]: (prev.toolingProfiles[type] ?? []).filter((l) => l.id !== id),
      },
    }));
  }, []);

  const discard = useCallback(() => {
    const live = snapshotFromRecord(record);
    setBaselineSnap(live);
    setDraft(live);
    lastSyncedLiveKey.current = record.updatedAt;
  }, [record]);

  const adoptAsBaseline = useCallback(
    (name?: string, note?: string) => {
      const label =
        name ||
        `Impact · ${new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "short",
        }).format(new Date())}`;
      adoptPlantSnapshot(draft, label, note ?? "Adopted from Impact lab");
      setBaselineSnap(structuredClone(draft));
      setDraft(structuredClone(draft));
    },
    [adoptPlantSnapshot, draft],
  );

  const saveAsScenario = useCallback(
    (name: string, note?: string) => {
      saveScenario(name, draft, note);
    },
    [saveScenario, draft],
  );

  const loadScenario = useCallback(
    (id: string) => {
      const hit = (record.scenarios ?? []).find((s) => s.id === id);
      if (!hit) return false;
      setBaselineSnap(snapshotFromRecord(record));
      setDraft(structuredClone(hit.snapshot));
      return true;
    },
    [record],
  );

  const value = useMemo<ImpactDraftValue>(
    () => ({
      baselineSnap,
      draft,
      dirty,
      dirtyTotal,
      moneyDirty,
      moneyDirtyTotal,
      isDirty,
      focusMachineId,
      setFocusMachineId,
      focusType,
      setFocusType,
      applyScope,
      setApplyScope,
      draftBreakups: draftComputed.draftBreakups,
      draftPlantKpis: draftComputed.draftPlantKpis,
      liveBreakups,
      patchPlant,
      patchUtilities,
      upsertDraftMachine,
      replaceDraftMachines,
      addDraftMachine,
      removeDraftMachine,
      setLabourForType,
      patchFocusedMachines,
      upsertLabourRole,
      removeLabourRole,
      setStatutory,
      upsertOverheadLine,
      removeOverheadLine,
      upsertToolingLine,
      removeToolingLine,
      discard,
      adoptAsBaseline,
      saveAsScenario,
      loadScenario,
      syncFromLive,
    }),
    [
      baselineSnap,
      draft,
      dirty,
      dirtyTotal,
      moneyDirty,
      moneyDirtyTotal,
      isDirty,
      focusMachineId,
      focusType,
      applyScope,
      draftComputed,
      liveBreakups,
      patchPlant,
      patchUtilities,
      upsertDraftMachine,
      replaceDraftMachines,
      addDraftMachine,
      removeDraftMachine,
      setLabourForType,
      patchFocusedMachines,
      upsertLabourRole,
      removeLabourRole,
      setStatutory,
      upsertOverheadLine,
      removeOverheadLine,
      upsertToolingLine,
      removeToolingLine,
      discard,
      adoptAsBaseline,
      saveAsScenario,
      loadScenario,
      syncFromLive,
    ],
  );

  return (
    <ImpactDraftContext.Provider value={value}>
      {children}
    </ImpactDraftContext.Provider>
  );
}

export function useImpactDraft() {
  const ctx = useContext(ImpactDraftContext);
  if (!ctx) {
    throw new Error("useImpactDraft must be used within ImpactDraftProvider");
  }
  return ctx;
}
