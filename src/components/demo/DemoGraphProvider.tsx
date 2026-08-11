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
  buildBaselineChanges,
  createInitialBaseline,
} from "@/lib/factory/baseline";
import {
  computeAllMachines,
  computePlantKpis,
  resolveScenarioInputs,
} from "@/lib/factory/calcEngine";
import { buildMhrExplainTree, findExplainNode } from "@/lib/factory/explain";
import {
  baselineFactory,
  baselineMachines,
  getScenario,
  MACHINE_BROTHER,
  scenarios as presetScenarios,
  snapshotToPatch,
} from "@/lib/factory/seed";
import {
  buildImpactCascade,
  computePartEconomics,
  computeQuoteEconomics,
  listAtRiskQuotes,
  profitAtFixedSellingRate,
  resolveVersionMhr,
} from "@/lib/factory/selectors";
import type {
  BaselineChange,
  BaselineVersion,
  ExplainNode,
  FactoryInputs,
  ImpactStep,
  MachineInputs,
  MhrBreakup,
  PartEconomics,
  PlantKpis,
  QuoteEconomics,
  ScenarioDef,
  ScenarioId,
} from "@/lib/factory/types";

type DemoGraphValue = {
  factory: FactoryInputs;
  machines: MachineInputs[];
  operatingFactory: FactoryInputs;
  operatingMachines: MachineInputs[];
  breakups: Record<string, MhrBreakup>;
  plant: PlantKpis;
  baselineBreakups: Record<string, MhrBreakup>;
  baselinePlant: PlantKpis;
  activeScenarioId: ScenarioId;
  scenarios: ScenarioDef[];
  baselineVersions: BaselineVersion[];
  activeBaseline: BaselineVersion;
  workingChanges: BaselineChange[];
  dirty: boolean;
  heroMachineId: string;
  /** Profit if selling ₹/hr stays at baseline (correct impact view). */
  decisionProfit: number;
  baselineDecisionProfit: number;
  patchFactory: (patch: Partial<FactoryInputs>) => void;
  patchMachine: (id: string, patch: Partial<MachineInputs>) => void;
  patchAllMachines: (patch: Partial<MachineInputs>) => void;
  setLabourAnnual: (machineId: string, annual: number) => void;
  applyScenario: (id: ScenarioId) => void;
  saveCustomScenario: (name: string, description?: string) => ScenarioId;
  removeCustomScenario: (id: ScenarioId) => void;
  adoptBaseline: (name: string, note?: string) => string | null;
  resetBaseline: () => void;
  getMachine: (id: string) => MachineInputs | undefined;
  getBreakup: (id: string) => MhrBreakup | undefined;
  getPartEconomics: (partId: string) => PartEconomics | null;
  getQuoteEconomics: (quotationId: string) => QuoteEconomics | null;
  getAtRiskQuotes: () => QuoteEconomics[];
  resolveMhr: (versionMhr: number, machineId?: string) => number;
  getImpactCascade: () => ImpactStep[];
  explainMachine: (machineId: string) => ExplainNode | null;
  explainNode: (machineId: string, nodeId: string) => ExplainNode | null;
};

const DemoGraphContext = createContext<DemoGraphValue | null>(null);
const STORAGE_KEY = "partiq-operating-baselines-v1";

type PersistedGraphState = {
  operatingFactory: FactoryInputs;
  operatingMachines: MachineInputs[];
  baselineVersions: BaselineVersion[];
  activeBaselineId: string;
  customScenarios: ScenarioDef[];
};

function buildState(factory: FactoryInputs, machines: MachineInputs[]) {
  const breakups = computeAllMachines(factory, machines);
  const plant = computePlantKpis(factory, machines, breakups);
  return { breakups, plant };
}

export function DemoGraphProvider({ children }: { children: ReactNode }) {
  const initialBaseline = useMemo(
    () => createInitialBaseline(baselineFactory, baselineMachines),
    [],
  );
  const [operatingFactory, setOperatingFactory] = useState<FactoryInputs>(() => ({
    ...baselineFactory,
  }));
  const [operatingMachines, setOperatingMachines] = useState<MachineInputs[]>(() =>
    baselineMachines.map((m) => ({ ...m })),
  );
  const [factory, setFactory] = useState<FactoryInputs>(() => ({
    ...baselineFactory,
  }));
  const [machines, setMachines] = useState<MachineInputs[]>(() =>
    baselineMachines.map((m) => ({ ...m })),
  );
  const [activeScenarioId, setActiveScenarioId] =
    useState<ScenarioId>("base");
  const [customScenarios, setCustomScenarios] = useState<ScenarioDef[]>([]);
  const [baselineVersions, setBaselineVersions] = useState<BaselineVersion[]>([
    initialBaseline,
  ]);
  const [activeBaselineId, setActiveBaselineId] = useState(initialBaseline.id);
  const [hydrated, setHydrated] = useState(false);
  const [dirty, setDirty] = useState(false);

  const baseline = useMemo(
    () => buildState(operatingFactory, operatingMachines),
    [operatingFactory, operatingMachines],
  );
  const current = useMemo(
    () => buildState(factory, machines),
    [factory, machines],
  );

  const allScenarios = useMemo(
    () => [...presetScenarios, ...customScenarios],
    [customScenarios],
  );

  const activeBaseline =
    baselineVersions.find((version) => version.id === activeBaselineId) ??
    baselineVersions[baselineVersions.length - 1] ??
    initialBaseline;

  const workingChanges = useMemo(
    () =>
      buildBaselineChanges(
        operatingFactory,
        operatingMachines,
        factory,
        machines,
      ),
    [operatingFactory, operatingMachines, factory, machines],
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PersistedGraphState;
        if (
          parsed.operatingFactory &&
          parsed.operatingMachines?.length &&
          parsed.baselineVersions?.length
        ) {
          setOperatingFactory(parsed.operatingFactory);
          setOperatingMachines(parsed.operatingMachines);
          setFactory(parsed.operatingFactory);
          setMachines(parsed.operatingMachines);
          setBaselineVersions(parsed.baselineVersions);
          setActiveBaselineId(
            parsed.activeBaselineId ??
              parsed.baselineVersions[parsed.baselineVersions.length - 1].id,
          );
          setCustomScenarios(parsed.customScenarios ?? []);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state: PersistedGraphState = {
      operatingFactory,
      operatingMachines,
      baselineVersions,
      activeBaselineId,
      customScenarios,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [
    hydrated,
    operatingFactory,
    operatingMachines,
    baselineVersions,
    activeBaselineId,
    customScenarios,
  ]);

  const markEdited = useCallback(() => {
    setActiveScenarioId("working");
    setDirty(true);
  }, []);

  const resetBaseline = useCallback(() => {
    setFactory({ ...operatingFactory });
    setMachines(operatingMachines.map((m) => ({ ...m })));
    setActiveScenarioId("base");
    setDirty(false);
  }, [operatingFactory, operatingMachines]);

  const applyScenario = useCallback(
    (id: ScenarioId) => {
      if (id === "working") return;
      const scenario = getScenario(id, customScenarios);
      const resolved = resolveScenarioInputs(
        operatingFactory,
        operatingMachines,
        scenario,
      );
      setFactory(resolved.factory);
      setMachines(resolved.machines);
      setActiveScenarioId(id);
      setDirty(id !== "base");
    },
    [customScenarios, operatingFactory, operatingMachines],
  );

  const patchFactory = useCallback(
    (patch: Partial<FactoryInputs>) => {
      setFactory((f) => ({ ...f, ...patch }));
      markEdited();
    },
    [markEdited],
  );

  const patchMachine = useCallback(
    (id: string, patch: Partial<MachineInputs>) => {
      setMachines((list) =>
        list.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      );
      markEdited();
    },
    [markEdited],
  );

  const patchAllMachines = useCallback(
    (patch: Partial<MachineInputs>) => {
      setMachines((list) => list.map((m) => ({ ...m, ...patch })));
      markEdited();
    },
    [markEdited],
  );

  const setLabourAnnual = useCallback(
    (machineId: string, annual: number) => {
      patchMachine(machineId, { labourAnnualAllocated: annual });
    },
    [patchMachine],
  );

  const saveCustomScenario = useCallback(
    (name: string, description?: string) => {
      const id = `custom-${Date.now()}`;
      const def: ScenarioDef = {
        id,
        name: name.trim() || "Custom scenario",
        description:
          description?.trim() ||
          "Saved from current Impact lab inputs.",
        patches: snapshotToPatch(
          factory,
          machines,
          operatingFactory,
          operatingMachines,
        ),
        custom: true,
      };
      setCustomScenarios((list) => [...list, def]);
      setActiveScenarioId(id);
      setDirty(true);
      return id;
    },
    [factory, machines, operatingFactory, operatingMachines],
  );

  const removeCustomScenario = useCallback((id: ScenarioId) => {
    setCustomScenarios((list) => list.filter((s) => s.id !== id));
    setActiveScenarioId((cur) => (cur === id ? "working" : cur));
  }, []);

  const adoptBaseline = useCallback(
    (name: string, note?: string) => {
      const changes = buildBaselineChanges(
        operatingFactory,
        operatingMachines,
        factory,
        machines,
      );
      if (changes.length === 0) return null;

      const id = `baseline-${Date.now()}`;
      const version: BaselineVersion = {
        id,
        name: name.trim() || `Operating baseline ${baselineVersions.length + 1}`,
        note: note?.trim() || undefined,
        createdAt: new Date().toISOString(),
        previousVersionId: activeBaselineId,
        factory: { ...factory },
        machines: machines.map((machine) => ({ ...machine })),
        changes,
      };

      setOperatingFactory({ ...factory });
      setOperatingMachines(machines.map((machine) => ({ ...machine })));
      setBaselineVersions((versions) => [...versions, version]);
      setActiveBaselineId(id);
      setActiveScenarioId("base");
      setDirty(false);
      return id;
    },
    [
      operatingFactory,
      operatingMachines,
      factory,
      machines,
      baselineVersions.length,
      activeBaselineId,
    ],
  );

  const brother = current.breakups[MACHINE_BROTHER];
  const baselineBrother = baseline.breakups[MACHINE_BROTHER];
  const decisionProfit = brother
    ? profitAtFixedSellingRate(baselineBrother, brother)
    : 0;
  const baselineDecisionProfit = baselineBrother
    ? profitAtFixedSellingRate(baselineBrother, baselineBrother)
    : 0;

  const value = useMemo<DemoGraphValue>(() => {
    return {
      factory,
      machines,
      operatingFactory,
      operatingMachines,
      breakups: current.breakups,
      plant: current.plant,
      baselineBreakups: baseline.breakups,
      baselinePlant: baseline.plant,
      activeScenarioId,
      scenarios: allScenarios,
      baselineVersions,
      activeBaseline,
      workingChanges,
      dirty,
      heroMachineId: MACHINE_BROTHER,
      decisionProfit,
      baselineDecisionProfit,
      patchFactory,
      patchMachine,
      patchAllMachines,
      setLabourAnnual,
      applyScenario,
      saveCustomScenario,
      removeCustomScenario,
      adoptBaseline,
      resetBaseline,
      getMachine: (id) => machines.find((m) => m.id === id),
      getBreakup: (id) => current.breakups[id],
      getPartEconomics: (partId) =>
        computePartEconomics(partId, current.breakups),
      getQuoteEconomics: (quotationId) =>
        computeQuoteEconomics(quotationId, current.breakups),
      getAtRiskQuotes: () => listAtRiskQuotes(current.breakups),
      resolveMhr: (versionMhr, machineId) =>
        resolveVersionMhr(versionMhr, machineId, current.breakups),
      getImpactCascade: () =>
        buildImpactCascade(
          baseline,
          current,
          MACHINE_BROTHER,
          "part-mid-3060",
          "quo-mid-2",
        ),
      explainMachine: (machineId) => {
        const m = machines.find((x) => x.id === machineId);
        const b = current.breakups[machineId];
        if (!m || !b) return null;
        return buildMhrExplainTree(factory, m, b);
      },
      explainNode: (machineId, nodeId) => {
        const m = machines.find((x) => x.id === machineId);
        const b = current.breakups[machineId];
        if (!m || !b) return null;
        const tree = buildMhrExplainTree(factory, m, b);
        return findExplainNode(tree, nodeId);
      },
    };
  }, [
    factory,
    machines,
    operatingFactory,
    operatingMachines,
    current,
    baseline,
    activeScenarioId,
    allScenarios,
    baselineVersions,
    activeBaseline,
    workingChanges,
    dirty,
    decisionProfit,
    baselineDecisionProfit,
    patchFactory,
    patchMachine,
    patchAllMachines,
    setLabourAnnual,
    applyScenario,
    saveCustomScenario,
    removeCustomScenario,
    adoptBaseline,
    resetBaseline,
  ]);

  return (
    <DemoGraphContext.Provider value={value}>
      {children}
    </DemoGraphContext.Provider>
  );
}

export function useDemoGraph(): DemoGraphValue {
  const ctx = useContext(DemoGraphContext);
  if (!ctx) {
    throw new Error("useDemoGraph must be used within DemoGraphProvider");
  }
  return ctx;
}
