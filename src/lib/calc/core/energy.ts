import type { BuildAnalysis } from "./analyze-build";

export function energySummary(analysis: BuildAnalysis) {
  return {
    totalEnLoad: analysis.totalEnLoad,
    enSupplyEfficiency: analysis.enSupplyEfficiency,
  };
}
