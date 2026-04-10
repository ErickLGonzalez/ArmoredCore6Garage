export * from "@/src/lib/calc";

// Compatibility exports for legacy import paths.
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
