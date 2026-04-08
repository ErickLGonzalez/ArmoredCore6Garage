import type { BuildAnalysis } from "./analyze-build";

/** Centralized picks for top-level build summary values. */
export function aggregateSummary(analysis: BuildAnalysis) {
  return {
    totalWeight: analysis.totalWeight,
    totalEnLoad: analysis.totalEnLoad,
    totalAp: analysis.totalAp,
    totalDef: analysis.totalDef,
    totalStability: analysis.totalStability,
  };
}
