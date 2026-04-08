import type { CanonicalPart } from "@/lib/schema";

/** Flat part record as consumed by legacy AC6 formulas (PascalCase keys). */
export type LegacyPart = Record<string, unknown>;

/** Assembly slots used by the reference garage. */
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

export type BuildAssembly = Partial<
  Record<AssemblySlot, CanonicalPart | null | undefined>
>;

/** One stat row from legacy computeAllStats. */
export type LegacyStatRow = {
  name: string;
  value: number | unknown[] | Record<string, unknown> | null;
  type?: string;
};

export type LegacyStatGroup = LegacyStatRow[];
