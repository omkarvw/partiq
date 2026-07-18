import type { AuditEvent, DashboardSignal, Part } from "./types";
import { calcCost, toSeconds } from "./costing";

const GCODE_O3060 = `O3060

N2000(START UP SUB)
G0G40G18G99T0
G310Z192.0T2100
M500
M01

N1(FRONT FACING)
/M88
G0G40Z192.0T0
T3131M104S2600P21
G0X-14.5Z10.0/M08
G0X-13.3Z-3.52
G01X-12.75Z-2.87F0.2
G03X-12.35Z-2.67R0.2F0.03
G01X-10.74F.02
Z-0.2
G03X-10.34Z0.0R0.2
G01X-8.7
G0X-20.0Z5.0
G0G40Z10.0
G0Z192.0T0M105
M88
M01

N2G40(ID )
G0G40Z192.0T0M08
T3434M103S3000
G0X8.0
Z1.0
G01X10.26Z0.0F0.15
G02X9.56Z-0.35R0.35
G01U-0.015Z-18.0F0.05
G0X9.35Z1.0
G0Z192.0T0M105
M01

N500(PARTING)
G0Z190.0T2100
M501
M30
%`;

export const PLANT_NAME = "Mumbai West Plant";
export const ORG_LABEL = "ORG-992A-X";

export const parts: Part[] = [
  {
    id: "part-mid-3060",
    code: "MID-3060",
    name: "High-pressure manifold housing",
    material: "EN1 Leaded Steel",
    customer: "HydraTech Global",
    description: "High-pressure manifold housing for hydraulic assembly.",
    status: "In Production",
    partFiles: [
      {
        id: "pf1",
        name: "Drawing_MID3060.pdf",
        kind: "pdf",
        sizeLabel: "1.2 MB",
        uploadedAt: "2026-07-10",
        uploadedBy: "Ravi",
      },
      {
        id: "pf2",
        name: "MID3060-3D.step",
        kind: "cad",
        sizeLabel: "8.4 MB",
        uploadedAt: "2026-07-10",
        uploadedBy: "Ravi",
      },
    ],
    processes: [
      {
        id: "proc-cnc-1",
        name: "CNC 1 - Roughing",
        description:
          "Initial block squaring and major material removal. Machine setup requires 20 mins. Tooling set T-401.",
        sequence: 1,
        currentVersion: 2,
        versions: [
          {
            versionNumber: 1,
            status: "archived",
            mhr: 1100,
            timeUnit: "minutes",
            timeEstimated: 50,
            timeActual: 48,
            customFields: [
              { id: "cf0", label: "Tooling Type", value: "HSS Rough Mill" },
            ],
            files: [
              {
                id: "f-old",
                name: "O3060_v1.P-2",
                kind: "gcode",
                sizeLabel: "3.8 KB",
                uploadedAt: "2026-07-01",
                uploadedBy: "S. Smith",
                versionNumber: 1,
                content: GCODE_O3060,
              },
            ],
            publishedAt: "2026-07-01 09:00",
            publishedBy: "S. Smith",
          },
          {
            versionNumber: 2,
            status: "current",
            mhr: 1250,
            timeUnit: "minutes",
            timeEstimated: 45,
            timeActual: 52,
            customFields: [
              { id: "cf1", label: "Tooling Type", value: "Carbide End Mill" },
              { id: "cf2", label: "Coolant", value: "Synthetic Emulsion" },
              { id: "cf3", label: "Work Center", value: "WC-CNC-04" },
              { id: "cf4", label: "Input Dia", value: "25 mm" },
              { id: "cf5", label: "Input Weight", value: "25 grams" },
            ],
            files: [
              {
                id: "f1",
                name: "O3060.P-2",
                kind: "gcode",
                sizeLabel: "4.2 KB",
                uploadedAt: "Today 09:41",
                uploadedBy: "J. Doe",
                versionNumber: 2,
                content: GCODE_O3060,
              },
              {
                id: "f2",
                name: "setup_sheet_v2.pdf",
                kind: "pdf",
                sizeLabel: "1.2 MB",
                uploadedAt: "Yesterday",
                uploadedBy: "Ravi",
                versionNumber: 2,
              },
              {
                id: "f3",
                name: "macro_vars.nc",
                kind: "gcode",
                sizeLabel: "1 KB",
                uploadedAt: "Yesterday",
                uploadedBy: "Ravi",
                versionNumber: 2,
                content: "(MACRO VARS)\n#500=25.0\n#501=50.0\nM99\n%",
              },
            ],
            publishedAt: "2026-07-15 09:30",
            publishedBy: "Admin",
          },
          {
            versionNumber: 3,
            status: "draft",
            mhr: 1250,
            timeUnit: "minutes",
            timeEstimated: 42,
            timeActual: 0,
            customFields: [
              { id: "cf1", label: "Tooling Type", value: "Carbide End Mill" },
              { id: "cf2", label: "Coolant", value: "Synthetic Emulsion" },
            ],
            files: [],
          },
        ],
      },
      {
        id: "proc-cnc-2",
        name: "CNC 2 - Finishing Profiles",
        description:
          "Contour finishing and deep pocket milling. Critical tolerance ±0.01mm on bore B2.",
        sequence: 2,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            status: "current",
            mhr: 1400,
            timeUnit: "minutes",
            timeEstimated: 135,
            timeActual: 135,
            customFields: [
              { id: "c1", label: "Tolerance", value: "±0.01 mm" },
            ],
            files: [
              {
                id: "fc2",
                name: "F3060.P-1",
                kind: "gcode",
                sizeLabel: "6.1 KB",
                uploadedAt: "2026-07-12",
                uploadedBy: "Ravi",
                versionNumber: 1,
                content: `O3061\n(FINISH PASS)\nG0G90G54\nT0404\nG01Z-0.25F0.08\nM30\n%`,
              },
              {
                id: "fc2b",
                name: "Setup_Sheet_Finish.pdf",
                kind: "pdf",
                sizeLabel: "980 KB",
                uploadedAt: "2026-07-12",
                uploadedBy: "Ravi",
                versionNumber: 1,
              },
            ],
            publishedAt: "2026-07-12 14:00",
            publishedBy: "Ravi",
          },
        ],
      },
      {
        id: "proc-vmc-1",
        name: "VMC 1 - Drilling & Tapping",
        description:
          "M6 and M8 threaded hole generation. Ensure proper coolant flow for tap life.",
        sequence: 3,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            status: "current",
            mhr: 950,
            timeUnit: "seconds",
            timeEstimated: 1800,
            timeActual: 2700,
            customFields: [{ id: "v1", label: "Tap Size", value: "M6 / M8" }],
            files: [],
            publishedAt: "2026-07-14 11:00",
            publishedBy: "J. Doe",
          },
        ],
      },
    ],
  },
  {
    id: "part-brk-118",
    code: "BRK-118",
    name: "Brake caliper bracket",
    material: "AL6061-T6",
    customer: "AutoForge Pvt",
    description: "Lightweight bracket for EV brake assembly.",
    status: "Quoting",
    partFiles: [],
    processes: [
      {
        id: "proc-vmc-brk",
        name: "VMC 1 - Pocketing",
        description: "3-axis pocketing and facing.",
        sequence: 1,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            status: "current",
            mhr: 800,
            timeUnit: "minutes",
            timeEstimated: 22,
            timeActual: 28,
            customFields: [],
            files: [],
            publishedAt: "2026-07-16 10:00",
            publishedBy: "Ravi",
          },
        ],
      },
    ],
  },
  {
    id: "part-shp-441",
    code: "SHP-441",
    name: "Shaft collar blank",
    material: "EN8",
    customer: "Internal",
    description: "Blank ready for secondary ops.",
    status: "Complete",
    partFiles: [],
    processes: [
      {
        id: "proc-cnc-shp",
        name: "CNC 1 - Turning",
        description: "OD turn and face.",
        sequence: 1,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            status: "current",
            mhr: 1000,
            timeUnit: "minutes",
            timeEstimated: 12,
            timeActual: 11,
            customFields: [],
            files: [],
            publishedAt: "2026-07-08 08:00",
            publishedBy: "S. Smith",
          },
        ],
      },
    ],
  },
];

export const auditEvents: AuditEvent[] = [
  {
    id: "a1",
    timestamp: "10:42:15",
    actor: "Ravi",
    actorType: "user",
    eventType: "UPDATE",
    details: "updated MHR ₹1100 → ₹1250",
    entityLabel: "CNC 1",
  },
  {
    id: "a2",
    timestamp: "09:30:04",
    actor: "System",
    actorType: "system",
    eventType: "PUBLISH",
    details: "Version v2 published by Admin",
    entityLabel: "CNC 1",
  },
  {
    id: "a3",
    timestamp: "16:20:00",
    dayLabel: "Yesterday",
    actor: "J. Doe",
    actorType: "user",
    eventType: "UPLOAD",
    details: "uploaded O3060.P-2 (v2)",
    entityLabel: "CNC 1",
  },
  {
    id: "a4",
    timestamp: "11:15:33",
    dayLabel: "Jul 15",
    actor: "Automated Process",
    actorType: "system",
    eventType: "VARIANCE",
    details: "Actual Time updated 45 → 52 min",
    entityLabel: "CNC 1",
  },
  {
    id: "a5",
    timestamp: "08:05:12",
    dayLabel: "Jul 14",
    actor: "S. Smith",
    actorType: "user",
    eventType: "CREATE",
    details: "Created process step CNC 1 - Roughing",
    entityLabel: "MID-3060",
  },
  {
    id: "a6",
    timestamp: "17:02:40",
    dayLabel: "Jul 12",
    actor: "Ravi",
    actorType: "user",
    eventType: "UPLOAD",
    details: "uploaded F3060.P-1 (v1)",
    entityLabel: "CNC 2",
  },
];

export const dashboardSignals: DashboardSignal[] = [
  {
    id: "s1",
    partCode: "MID-3060",
    processName: "CNC 1",
    metric: "time",
    variancePct: 15.5,
    message: "Actual time overrun vs estimate",
  },
  {
    id: "s2",
    partCode: "MID-3060",
    processName: "VMC 1",
    metric: "time",
    variancePct: 50,
    message: "Tapping cycle 15 min over estimate",
  },
  {
    id: "s3",
    partCode: "BRK-118",
    processName: "VMC 1",
    metric: "cost",
    variancePct: 27.3,
    message: "Cost overrun from extended pocketing",
  },
];

/** Plant-wide aggregate weekly Est/Act cost (all parts). */
export const plantWeeklyTrend = [
  { week: "W23", estimated: 9200, actual: 9800 },
  { week: "W24", estimated: 8800, actual: 9100 },
  { week: "W25", estimated: 10200, actual: 11100 },
  { week: "W26", estimated: 9700, actual: 10450 },
  { week: "W27", estimated: 10500, actual: 11800 },
  { week: "W28", estimated: 9900, actual: 10620 },
];

/** Dummy weekly Est/Act cost trend keyed by part id */
export const partWeeklyTrends: Record<
  string,
  { week: string; estimated: number; actual: number }[]
> = {
  "part-mid-3060": [
    { week: "W23", estimated: 4800, actual: 5100 },
    { week: "W24", estimated: 4650, actual: 4900 },
    { week: "W25", estimated: 5200, actual: 5750 },
    { week: "W26", estimated: 5050, actual: 5480 },
    { week: "W27", estimated: 5400, actual: 6100 },
    { week: "W28", estimated: 5056, actual: 5503 },
  ],
  "part-brk-118": [
    { week: "W23", estimated: 280, actual: 310 },
    { week: "W24", estimated: 290, actual: 340 },
    { week: "W25", estimated: 300, actual: 380 },
    { week: "W26", estimated: 295, actual: 360 },
    { week: "W27", estimated: 310, actual: 395 },
    { week: "W28", estimated: 293, actual: 373 },
  ],
  "part-shp-441": [
    { week: "W23", estimated: 190, actual: 185 },
    { week: "W24", estimated: 200, actual: 195 },
    { week: "W25", estimated: 210, actual: 200 },
    { week: "W26", estimated: 195, actual: 190 },
    { week: "W27", estimated: 205, actual: 198 },
    { week: "W28", estimated: 200, actual: 183 },
  ],
};

export function getPart(partId: string): Part | undefined {
  return parts.find((p) => p.id === partId);
}

/**
 * Cost trend across versions of one process (or all processes if processId omitted).
 * Points ordered by version number for line charts.
 */
export function getProcessVersionCostTrend(partId: string, processId?: string) {
  const part = getPart(partId);
  if (!part) return [];

  const processes = processId
    ? part.processes.filter((p) => p.id === processId)
    : part.processes;

  return processes.flatMap((proc) =>
    [...proc.versions]
      .sort((a, b) => a.versionNumber - b.versionNumber)
      .map((v) => {
        const est = calcCost(v.mhr, v.timeEstimated, v.timeUnit);
        const act =
          v.timeActual > 0 ? calcCost(v.mhr, v.timeActual, v.timeUnit) : null;
        return {
          key: `v${v.versionNumber}`,
          label: `v${v.versionNumber}`,
          processId: proc.id,
          processName: proc.name.split(" - ")[0],
          versionNumber: v.versionNumber,
          status: v.status,
          estimated: Math.round(est * 100) / 100,
          actual: act === null ? null : Math.round(act * 100) / 100,
        };
      }),
  );
}

export function getPartSignals(partCode: string) {
  return dashboardSignals.filter((s) => s.partCode === partCode);
}

/** Totals: costs in currency; times aggregated as seconds for mixed units. */
export function getPlantTotals() {
  let estCost = 0;
  let actCost = 0;
  let estTimeSec = 0;
  let actTimeSec = 0;
  parts.forEach((part) => {
    part.processes.forEach((proc) => {
      const v = getCurrentVersion(proc);
      estCost += calcCost(v.mhr, v.timeEstimated, v.timeUnit);
      actCost += calcCost(v.mhr, v.timeActual, v.timeUnit);
      estTimeSec += toSeconds(v.timeEstimated, v.timeUnit);
      actTimeSec += toSeconds(v.timeActual, v.timeUnit);
    });
  });
  return { estCost, actCost, estTimeSec, actTimeSec };
}


export function getProcess(partId: string, processId: string) {
  const part = getPart(partId);
  if (!part) return undefined;
  const process = part.processes.find((p) => p.id === processId);
  if (!process) return undefined;
  return { part, process };
}

export function getCurrentVersion(process: Part["processes"][number]) {
  return (
    process.versions.find((v) => v.versionNumber === process.currentVersion) ??
    process.versions[process.versions.length - 1]
  );
}
