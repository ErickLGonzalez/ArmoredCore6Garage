import type { BuildAnalysis } from "./analyze-build";

export function mobilitySummary(analysis: BuildAnalysis) {
  return {
    groundedBoostSpeed: analysis.groundedBoostSpeed,
    qbReload: analysis.qbReload,
  };
}
