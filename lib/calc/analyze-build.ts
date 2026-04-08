import type { BuildAnalysis, BuildAssembly } from "./types";

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/**
 * Baseline build analysis. Weight and EN load are summed from `baseStats`.
 * Other fields are reserved for Milestone 3+ (AP, defenses, weapon-derived metrics).
 */
export function analyzeBuild(assembly: BuildAssembly): BuildAnalysis {
  let totalWeight = 0;
  let totalEnLoad = 0;

  for (const part of Object.values(assembly)) {
    if (!part) continue;
    totalWeight += num(part.baseStats.Weight);
    totalEnLoad += num(part.baseStats.ENLoad);
  }

  return {
    totalWeight,
    totalEnLoad,
    totalAp: 0,
    totalDef: 0,
    totalStability: 0,
    boostSpeed: 0,
    qbReload: 0,
    enEfficiency: 0,
    dps: 0,
    burstDps: 0,
    impactPerSecond: 0,
    accumulativeImpactPerSecond: 0,
  };
}
