"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useV2Graph } from "@/components/v2/V2GraphProvider";
import { Panel } from "@/components/ui/Primitives";
import { V2Field, V2Input, V2Select, V2SecondaryButton } from "@/components/v2/V2Ui";
import { upsertPart } from "@/lib/commercial/entityStore";
import {
  computeMaterialCost,
  findMaterialGrade,
} from "@/lib/commercial/materialCost";
import { formatInr } from "@/lib/costing";
import type { Part, PartMaterialCosting } from "@/lib/types";

export function PartMaterialPanel({ part }: { part: Part }) {
  const router = useRouter();
  const { record } = useV2Graph();
  const grades = record.materialGrades ?? [];
  const initial = part.materialCosting;
  const [gradeId, setGradeId] = useState(
    initial?.materialGradeId ?? grades[0]?.id ?? "",
  );
  const [inputKg, setInputKg] = useState(initial?.inputWeightKg ?? 0);
  const [finishKg, setFinishKg] = useState(initial?.finishWeightKg ?? 0);
  const [saved, setSaved] = useState(false);

  const grade = findMaterialGrade(grades, gradeId || null);
  const net = useMemo(
    () =>
      grade
        ? computeMaterialCost({
            inputWeightKg: inputKg,
            finishWeightKg: finishKg,
            rawRatePerKg: grade.rawRatePerKg,
            scrapRatePerKg: grade.scrapRatePerKg,
          })
        : 0,
    [finishKg, grade, inputKg],
  );

  function save() {
    const block: PartMaterialCosting = {
      materialGradeId: gradeId || null,
      inputWeightKg: inputKg,
      finishWeightKg: finishKg,
    };
    upsertPart({
      ...part,
      material: grade?.name ?? part.material,
      materialCosting: block,
    });
    setSaved(true);
    router.refresh();
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <Panel title="Material cost">
      <div className="space-y-3 p-4">
        <p className="text-body-sm text-on-surface-variant">
          Weights stay on this part. Rates come from the plant grade master —{" "}
          <Link
            href="/master-data/materials"
            className="font-medium text-primary hover:underline"
          >
            change rates in Master data
          </Link>
          .
        </p>
        {grades.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant">
            No grades yet. Add them under Master data, then return here.
          </p>
        ) : (
          <>
            <V2Field label="Grade">
              <V2Select
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
              >
                <option value="">Select grade</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </V2Select>
            </V2Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <V2Field label="Input weight (kg)">
                <V2Input
                  type="number"
                  step={0.01}
                  value={inputKg}
                  onChange={(e) => setInputKg(Number(e.target.value) || 0)}
                />
              </V2Field>
              <V2Field label="Finish weight (kg)">
                <V2Input
                  type="number"
                  step={0.01}
                  value={finishKg}
                  onChange={(e) => setFinishKg(Number(e.target.value) || 0)}
                />
              </V2Field>
            </div>
            {grade ? (
              <div className="rounded-lg border border-outline-variant bg-surface px-3 py-2">
                <p className="text-body-sm text-on-surface-variant">
                  Raw {formatInr(grade.rawRatePerKg)}/kg · Scrap{" "}
                  {formatInr(grade.scrapRatePerKg)}/kg
                </p>
                <p className="mt-1 font-mono text-body-md tabular-nums text-on-surface">
                  Net material {formatInr(net)}
                </p>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <V2SecondaryButton type="button" onClick={save}>
                Save material
              </V2SecondaryButton>
              {saved ? (
                <span className="text-body-sm text-on-surface-variant">
                  Saved on this computer
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}
