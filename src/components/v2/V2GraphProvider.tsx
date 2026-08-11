"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  computeAllMachines,
  computePlantKpis,
} from "@/lib/factory/calcEngine";
import type { MachineInputs, MhrBreakup, PlantKpis } from "@/lib/factory/types";
import { resolveVersionMhr } from "@/lib/factory/selectors";
import { resolvePlantMachineId } from "@/lib/plant/machineBridge";
import {
  addMachinesOfType,
  applySnapshotToRecord,
  clearClientRecord,
  createBaselineVersion,
  createEmptyClientRecord,
  createScenarioVersion,
  defaultToolingLines,
  ensureLabourByType,
  ensureToolingProfile,
  exampleLabourByType,
  exampleMachines,
  examplePlant,
  exampleToolingProfiles,
  hasCompletedOnboarding,
  readClientRecord,
  snapshotFromRecord,
  toFactoryInputs,
  toMachineInputs,
  writeClientRecord,
  pruneEmptyMachineTypes,
  type OnboardingStep,
  type V2BaselineSnapshot,
  type V2BaselineVersion,
  type V2ClientRecord,
  type V2LabourRole,
  type V2MachineDraft,
  type V2OhLine,
  type V2PlantDraft,
  type V2ScenarioVersion,
  type V2Section,
  type V2Statutory,
  type V2ToolingLine,
} from "@/lib/v2/clientDb";

type V2GraphValue = {
  ready: boolean;
  record: V2ClientRecord;
  onboarded: boolean;
  breakups: Record<string, MhrBreakup>;
  plantKpis: PlantKpis | null;
  heroMachineId: string | null;
  setStep: (step: OnboardingStep) => void;
  updatePlant: (patch: Partial<V2PlantDraft>) => void;
  setMachines: (machines: V2MachineDraft[]) => void;
  setSections: (sections: V2Section[]) => void;
  upsertMachine: (machine: V2MachineDraft) => void;
  removeMachine: (id: string) => void;
  addBulkMachines: (
    type: string,
    count: number,
    defaults?: Partial<V2MachineDraft>,
  ) => void;
  addMachineType: (type: string) => void;
  upsertLabourRole: (type: string, role: V2LabourRole) => void;
  removeLabourRole: (type: string, id: string) => void;
  setLabourForType: (type: string, roles: V2LabourRole[]) => void;
  setStatutory: (patch: Partial<V2Statutory>) => void;
  setOverheadLines: (lines: V2OhLine[]) => void;
  upsertOverheadLine: (line: V2OhLine) => void;
  removeOverheadLine: (id: string) => void;
  upsertTypeToolingLine: (type: string, line: V2ToolingLine) => void;
  removeTypeToolingLine: (type: string, id: string) => void;
  setMachineToolingOverride: (
    machineId: string,
    lines: V2ToolingLine[] | null,
  ) => void;
  applyPlantExample: () => void;
  applyMachineExample: () => void;
  markTourSeen: () => void;
  completeOnboarding: () => void;
  reopenSetup: () => void;
  resetClient: () => void;
  saveBaseline: (name: string, note?: string) => V2BaselineVersion | null;
  restoreBaseline: (id: string) => boolean;
  adoptPlantSnapshot: (
    snapshot: V2BaselineSnapshot,
    baselineName?: string,
    baselineNote?: string,
  ) => void;
  saveScenario: (
    name: string,
    snapshot: V2BaselineSnapshot,
    note?: string,
  ) => V2ScenarioVersion | null;
  deleteScenario: (id: string) => void;
  activeBaseline: V2BaselineVersion | null;
  /** Resolve process-version MHR from live plant breakups (bridges legacy machine ids). */
  resolveMhr: (versionMhr: number, machineId?: string) => number;
  /** Live plant machine inputs by id (after legacy bridge). */
  getMachine: (machineId: string) => MachineInputs | undefined;
  getBreakup: (machineId: string) => MhrBreakup | undefined;
  /** Map legacy/demo machine id → live plant machine id. */
  resolveMachineId: (machineId?: string) => string | undefined;
};

const V2GraphContext = createContext<V2GraphValue | null>(null);

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

function withTypeCatalog(
  record: V2ClientRecord,
  types: string[],
): Pick<V2ClientRecord, "machineTypes" | "toolingProfiles" | "labourByType"> {
  const machineTypes = Array.from(
    new Set([...record.machineTypes, ...types].filter(Boolean)),
  );
  return {
    machineTypes,
    toolingProfiles: ensureToolingProfile(record.toolingProfiles, machineTypes),
    labourByType: ensureLabourByType(record.labourByType, machineTypes),
  };
}

export function V2GraphProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [record, setRecord] = useState<V2ClientRecord>(createEmptyClientRecord);

  useEffect(() => {
    const stored = readClientRecord();
    setRecord(stored ?? createEmptyClientRecord());
    setReady(true);
  }, []);

  /** Functional update — keeps setter identities stable across renders. */
  const persist = useCallback(
    (updater: (prev: V2ClientRecord) => V2ClientRecord) => {
      setRecord((prev) => {
        const next = updater(prev);
        if (next === prev) return prev;
        return writeClientRecord(next);
      });
    },
    [],
  );

  const setStep = useCallback(
    (step: OnboardingStep) => {
      persist((prev) =>
        prev.lastStep === step ? prev : { ...prev, lastStep: step },
      );
    },
    [persist],
  );

  const updatePlant = useCallback(
    (patch: Partial<V2PlantDraft>) => {
      persist((prev) => ({
        ...prev,
        plant: { ...prev.plant, ...patch },
      }));
    },
    [persist],
  );

  const setMachines = useCallback(
    (machines: V2MachineDraft[]) => {
      persist((prev) => {
        const next = { ...prev, machines };
        return {
          ...next,
          ...withTypeCatalog(
            next,
            machines.map((machine) => machine.type),
          ),
          ...pruneEmptyMachineTypes({ ...next, machines }),
        };
      });
    },
    [persist],
  );

  const setSections = useCallback(
    (sections: import("@/lib/v2/clientDb").V2Section[]) => {
      persist((prev) => ({ ...prev, sections }));
    },
    [persist],
  );

  const upsertMachine = useCallback(
    (machine: V2MachineDraft) => {
      persist((prev) => {
        const exists = prev.machines.some((item) => item.id === machine.id);
        const machines = exists
          ? prev.machines.map((item) =>
              item.id === machine.id ? machine : item,
            )
          : [...prev.machines, machine];
        return {
          ...prev,
          machines,
          ...withTypeCatalog(prev, [machine.type]),
        };
      });
    },
    [persist],
  );

  const removeMachine = useCallback(
    (id: string) => {
      persist((prev) => {
        const machines = prev.machines.filter((machine) => machine.id !== id);
        return {
          ...prev,
          machines,
          ...pruneEmptyMachineTypes({ ...prev, machines }),
        };
      });
    },
    [persist],
  );

  const addBulkMachines = useCallback(
    (type: string, count: number, defaults?: Partial<V2MachineDraft>) => {
      persist((prev) => {
        const machines = addMachinesOfType(prev.machines, type, count, defaults);
        return {
          ...prev,
          machines,
          ...withTypeCatalog(prev, [type]),
        };
      });
    },
    [persist],
  );

  const addMachineType = useCallback(
    (type: string) => {
      const trimmed = type.trim();
      if (!trimmed) return;
      persist((prev) => ({
        ...prev,
        ...withTypeCatalog(prev, [trimmed]),
      }));
    },
    [persist],
  );

  const upsertLabourRole = useCallback(
    (type: string, role: V2LabourRole) => {
      persist((prev) => {
        const existing = prev.labourByType[type] ?? [];
        const hit = existing.some((item) => item.id === role.id);
        const roles = hit
          ? existing.map((item) => (item.id === role.id ? role : item))
          : [...existing, role];
        return {
          ...prev,
          labourByType: { ...prev.labourByType, [type]: roles },
        };
      });
    },
    [persist],
  );

  const removeLabourRole = useCallback(
    (type: string, id: string) => {
      persist((prev) => {
        const existing = prev.labourByType[type] ?? [];
        return {
          ...prev,
          labourByType: {
            ...prev.labourByType,
            [type]: existing.filter((role) => role.id !== id),
          },
        };
      });
    },
    [persist],
  );

  const setLabourForType = useCallback(
    (type: string, roles: V2LabourRole[]) => {
      persist((prev) => ({
        ...prev,
        labourByType: { ...prev.labourByType, [type]: roles },
      }));
    },
    [persist],
  );

  const setStatutory = useCallback(
    (patch: Partial<V2Statutory>) => {
      persist((prev) => ({
        ...prev,
        statutory: { ...prev.statutory, ...patch },
      }));
    },
    [persist],
  );

  const setOverheadLines = useCallback(
    (overheadLines: V2OhLine[]) => {
      persist((prev) => ({ ...prev, overheadLines }));
    },
    [persist],
  );

  const upsertOverheadLine = useCallback(
    (line: V2OhLine) => {
      persist((prev) => {
        const exists = prev.overheadLines.some((item) => item.id === line.id);
        const overheadLines = exists
          ? prev.overheadLines.map((item) =>
              item.id === line.id ? line : item,
            )
          : [...prev.overheadLines, line];
        return { ...prev, overheadLines };
      });
    },
    [persist],
  );

  const removeOverheadLine = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        overheadLines: prev.overheadLines.filter((line) => line.id !== id),
      }));
    },
    [persist],
  );

  const upsertTypeToolingLine = useCallback(
    (type: string, line: V2ToolingLine) => {
      persist((prev) => {
        const existing = prev.toolingProfiles[type] ?? defaultToolingLines();
        const hit = existing.some((item) => item.id === line.id);
        const lines = hit
          ? existing.map((item) => (item.id === line.id ? line : item))
          : [...existing, line];
        return {
          ...prev,
          toolingProfiles: { ...prev.toolingProfiles, [type]: lines },
        };
      });
    },
    [persist],
  );

  const removeTypeToolingLine = useCallback(
    (type: string, id: string) => {
      persist((prev) => {
        const existing = prev.toolingProfiles[type] ?? defaultToolingLines();
        return {
          ...prev,
          toolingProfiles: {
            ...prev.toolingProfiles,
            [type]: existing.filter((item) => item.id !== id),
          },
        };
      });
    },
    [persist],
  );

  const setMachineToolingOverride = useCallback(
    (machineId: string, lines: V2ToolingLine[] | null) => {
      persist((prev) => ({
        ...prev,
        machines: prev.machines.map((machine) =>
          machine.id === machineId
            ? { ...machine, toolingOverride: lines }
            : machine,
        ),
      }));
    },
    [persist],
  );

  const applyPlantExample = useCallback(() => {
    persist((prev) => ({ ...prev, plant: examplePlant() }));
  }, [persist]);

  const applyMachineExample = useCallback(() => {
    persist((prev) => {
      const section =
        prev.sections[0] ?? {
          id: `sec-${Date.now()}`,
          name: "Main shop",
          sortOrder: 0,
        };
      const machines = exampleMachines(section.id);
      const types = ["VMC", "CNC Lathe"];
      return {
        ...prev,
        sections: prev.sections.length > 0 ? prev.sections : [section],
        machines,
        machineTypes: types,
        toolingProfiles: {
          ...prev.toolingProfiles,
          ...exampleToolingProfiles(),
        },
        labourByType: {
          ...prev.labourByType,
          ...exampleLabourByType(),
        },
      };
    });
  }, [persist]);

  const markTourSeen = useCallback(() => {
    persist((prev) => ({ ...prev, tourSeen: true, lastStep: "plant" }));
  }, [persist]);

  const completeOnboarding = useCallback(() => {
    persist((prev) => {
      const initial =
        prev.baselines.length === 0
          ? createBaselineVersion("Initial operating baseline", prev, "Created at first launch")
          : null;
      const baselines = initial
        ? [...prev.baselines, initial]
        : prev.baselines;
      return {
        ...prev,
        onboardingComplete: true,
        lastStep: "complete",
        baselines,
        activeBaselineId: initial?.id ?? prev.activeBaselineId,
      };
    });
  }, [persist]);

  const reopenSetup = useCallback(() => {
    persist((prev) => ({
      ...prev,
      onboardingComplete: false,
      lastStep: "plant",
    }));
  }, [persist]);

  const resetClient = useCallback(() => {
    clearClientRecord();
    setRecord(createEmptyClientRecord());
  }, []);

  const saveBaseline = useCallback(
    (name: string, note?: string) => {
      let created: V2BaselineVersion | null = null;
      persist((prev) => {
        created = createBaselineVersion(name, prev, note);
        return {
          ...prev,
          baselines: [...prev.baselines, created!],
          activeBaselineId: created!.id,
        };
      });
      return created;
    },
    [persist],
  );

  const restoreBaseline = useCallback(
    (id: string) => {
      let ok = false;
      persist((prev) => {
        const hit = prev.baselines.find((b) => b.id === id);
        if (!hit) return prev;
        ok = true;
        return {
          ...applySnapshotToRecord(prev, hit.snapshot),
          activeBaselineId: hit.id,
        };
      });
      return ok;
    },
    [persist],
  );

  const adoptPlantSnapshot = useCallback(
    (
      snapshot: V2BaselineSnapshot,
      baselineName?: string,
      baselineNote?: string,
    ) => {
      persist((prev) => {
        let next = applySnapshotToRecord(prev, snapshot);
        if (baselineName) {
          const created = createBaselineVersion(
            baselineName,
            next,
            baselineNote,
          );
          next = {
            ...next,
            baselines: [...next.baselines, created],
            activeBaselineId: created.id,
          };
        }
        return next;
      });
    },
    [persist],
  );

  const saveScenario = useCallback(
    (name: string, snapshot: V2BaselineSnapshot, note?: string) => {
      let created: V2ScenarioVersion | null = null;
      persist((prev) => {
        created = createScenarioVersion(name, snapshot, note);
        return {
          ...prev,
          scenarios: [...(prev.scenarios ?? []), created!],
        };
      });
      return created;
    },
    [persist],
  );

  const deleteScenario = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        scenarios: (prev.scenarios ?? []).filter((s) => s.id !== id),
      }));
    },
    [persist],
  );

  const onboarded = hasCompletedOnboarding(record);
  const activeBaseline =
    record.baselines.find((b) => b.id === record.activeBaselineId) ??
    record.baselines[record.baselines.length - 1] ??
    null;

  const computed = useMemo(() => {
    if (!onboarded) {
      return {
        breakups: {} as Record<string, MhrBreakup>,
        plantKpis: emptyKpis(),
        heroMachineId: null as string | null,
        machineInputs: [] as MachineInputs[],
      };
    }
    const factory = toFactoryInputs(record.plant, record);
    const machines = toMachineInputs(record);
    const breakups = computeAllMachines(factory, machines);
    const plantKpis = computePlantKpis(factory, machines, breakups);
    return {
      breakups,
      plantKpis,
      heroMachineId: machines[0]?.id ?? null,
      machineInputs: machines,
    };
  }, [onboarded, record]);

  const resolveMachineId = useCallback(
    (machineId?: string) =>
      resolvePlantMachineId(machineId, record.machines),
    [record.machines],
  );

  const resolveMhr = useCallback(
    (versionMhr: number, machineId?: string) => {
      const id = resolvePlantMachineId(machineId, record.machines);
      return resolveVersionMhr(versionMhr, id, computed.breakups);
    },
    [record.machines, computed.breakups],
  );

  const getMachine = useCallback(
    (machineId: string) => {
      const id = resolvePlantMachineId(machineId, record.machines);
      return computed.machineInputs.find((m) => m.id === id);
    },
    [record.machines, computed.machineInputs],
  );

  const getBreakup = useCallback(
    (machineId: string) => {
      const id = resolvePlantMachineId(machineId, record.machines);
      return id ? computed.breakups[id] : undefined;
    },
    [record.machines, computed.breakups],
  );

  const value = useMemo<V2GraphValue>(
    () => ({
      ready,
      record,
      onboarded,
      breakups: computed.breakups,
      plantKpis: computed.plantKpis,
      heroMachineId: computed.heroMachineId,
      setStep,
      updatePlant,
      setMachines,
      setSections,
      upsertMachine,
      removeMachine,
      addBulkMachines,
      addMachineType,
      upsertLabourRole,
      removeLabourRole,
      setLabourForType,
      setStatutory,
      setOverheadLines,
      upsertOverheadLine,
      removeOverheadLine,
      upsertTypeToolingLine,
      removeTypeToolingLine,
      setMachineToolingOverride,
      applyPlantExample,
      applyMachineExample,
      markTourSeen,
      completeOnboarding,
      reopenSetup,
      resetClient,
      saveBaseline,
      restoreBaseline,
      adoptPlantSnapshot,
      saveScenario,
      deleteScenario,
      activeBaseline,
      resolveMhr,
      getMachine,
      getBreakup,
      resolveMachineId,
    }),
    [
      ready,
      record,
      onboarded,
      computed,
      setStep,
      updatePlant,
      setMachines,
      setSections,
      upsertMachine,
      removeMachine,
      addBulkMachines,
      addMachineType,
      upsertLabourRole,
      removeLabourRole,
      setLabourForType,
      setStatutory,
      setOverheadLines,
      upsertOverheadLine,
      removeOverheadLine,
      upsertTypeToolingLine,
      removeTypeToolingLine,
      setMachineToolingOverride,
      applyPlantExample,
      applyMachineExample,
      markTourSeen,
      completeOnboarding,
      reopenSetup,
      resetClient,
      saveBaseline,
      restoreBaseline,
      adoptPlantSnapshot,
      saveScenario,
      deleteScenario,
      activeBaseline,
      resolveMhr,
      getMachine,
      getBreakup,
      resolveMachineId,
    ],
  );

  return (
    <V2GraphContext.Provider value={value}>{children}</V2GraphContext.Provider>
  );
}

export function useV2Graph() {
  const ctx = useContext(V2GraphContext);
  if (!ctx) throw new Error("useV2Graph must be used within V2GraphProvider");
  return ctx;
}
