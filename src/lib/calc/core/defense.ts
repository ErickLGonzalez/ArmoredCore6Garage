import type { BuildAnalysis } from "./analyze-build";

export function defenseSummary(analysis: BuildAnalysis) {
  return {
    totalAp: analysis.totalAp,
    totalDef: analysis.totalDef,
    totalStability: analysis.totalStability,
  };
}
