import type { BuildAnalysis } from "@/lib/calc";

/**
 * Picks the analysis object shown in the garage when "modified unit specs" is on:
 * use `modified` when present; otherwise `base`. Returns null if `base` is null.
 */
export function pickActiveBuildAnalysis(
  base: BuildAnalysis | null,
  modified: BuildAnalysis | null,
  useModified: boolean,
): BuildAnalysis | null {
  if (!base) return null;
  if (useModified && modified) return modified;
  return base;
}
