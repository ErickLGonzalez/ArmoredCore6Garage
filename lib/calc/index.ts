export {
  computeFullAccuracy,
  fcsAssistAtDistance,
  parseAimAssistGraph,
  rangeBandDefaultDistanceM,
  recoilDamageMultiplier,
  type FullAccuracyConfig,
  type FullAccuracyResult,
  type RangeBand,
} from "./accuracy";
export { analyzeBuild, type BuildAnalysis } from "./analyze-build";
export {
  assemblyToLegacyMap,
  canonicalToLegacyPart,
  REQUIRED_ASSEMBLY_SLOTS,
  type RequiredAssemblySlot,
} from "./assembly-map";
export {
  computeAllStats,
  findLegacyStat,
  type AcPartsMap,
} from "./compute-all-stats";
export { mean, piecewiseLinear, total } from "./math";
export { postprocessLegacyDataset } from "./postprocess";
export type {
  AssemblySlot,
  BuildAssembly,
  LegacyPart,
  LegacyStatGroup,
  LegacyStatRow,
} from "./types";
