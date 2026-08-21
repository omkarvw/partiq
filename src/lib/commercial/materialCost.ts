import type { Part } from "@/lib/types";
import type { V2MaterialGrade } from "@/lib/v2/clientDb";

export type MaterialCostInput = {
  inputWeightKg: number;
  finishWeightKg: number;
  rawRatePerKg: number;
  scrapRatePerKg: number;
};

/**
 * Costing Software net material:
 * input×rawRate − max(0, input−finish)×scrapRate
 */
export function computeMaterialCost(input: MaterialCostInput): number {
  const inputKg = Math.max(0, Number(input.inputWeightKg) || 0);
  const finishKg = Math.max(0, Number(input.finishWeightKg) || 0);
  const raw = Math.max(0, Number(input.rawRatePerKg) || 0);
  const scrap = Math.max(0, Number(input.scrapRatePerKg) || 0);
  const scrapMass = Math.max(0, inputKg - finishKg);
  return inputKg * raw - scrapMass * scrap;
}

export function findMaterialGrade(
  grades: V2MaterialGrade[],
  gradeId: string | null | undefined,
): V2MaterialGrade | null {
  if (!gradeId) return null;
  return grades.find((g) => g.id === gradeId) ?? null;
}

export function resolvePartMaterialCost(
  part: Part,
  grades: V2MaterialGrade[],
): number {
  const block = part.materialCosting;
  if (!block) return 0;
  const grade = findMaterialGrade(grades, block.materialGradeId);
  if (!grade) return 0;
  return computeMaterialCost({
    inputWeightKg: block.inputWeightKg,
    finishWeightKg: block.finishWeightKg,
    rawRatePerKg: grade.rawRatePerKg,
    scrapRatePerKg: grade.scrapRatePerKg,
  });
}
