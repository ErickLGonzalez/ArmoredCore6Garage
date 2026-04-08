import type { BuildAnalysis } from "./analyze-build";

export function offenseSummary(analysis: BuildAnalysis) {
  return {
    dps: analysis.dps,
    burstDps: analysis.burstDps,
    impactPerSecond: analysis.impactPerSecond,
    accumulativeImpactPerSecond: analysis.accumulativeImpactPerSecond,
  };
}
