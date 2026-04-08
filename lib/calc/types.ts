import type { CanonicalPart } from "@/lib/schema";

/** Assembly slots used by the garage (legacy app naming). */
export type AssemblySlot =
  | "rightArm"
  | "leftArm"
  | "rightBack"
  | "leftBack"
  | "head"
  | "core"
  | "arms"
  | "legs"
  | "booster"
  | "fcs"
  | "generator"
  | "expansion";

export type BuildAssembly = Partial<Record<AssemblySlot, CanonicalPart | null>>;

export type BuildAnalysis = {
  totalWeight: number;
  totalEnLoad: number;
  totalAp: number;
  totalDef: number;
  totalStability: number;
  boostSpeed: number;
  qbReload: number;
  enEfficiency: number;
  dps: number;
  burstDps: number;
  impactPerSecond: number;
  accumulativeImpactPerSecond: number;
};
