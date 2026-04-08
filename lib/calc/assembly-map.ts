import type { CanonicalPart } from "@/lib/schema";

import type { AcPartsMap } from "./compute-all-stats";
import { LEGACY_NONE_EXPANSION } from "./legacy-none-parts";
import type { AssemblySlot, BuildAssembly, LegacyPart } from "./types";

/** Slots required for `assemblyToLegacyMap` / `analyzeBuild` (matches legacy garage). */
export const REQUIRED_ASSEMBLY_SLOTS = [
  "rightArm",
  "leftArm",
  "rightBack",
  "leftBack",
  "head",
  "core",
  "arms",
  "legs",
  "booster",
  "fcs",
  "generator",
] as const satisfies readonly AssemblySlot[];

export type RequiredAssemblySlot = (typeof REQUIRED_ASSEMBLY_SLOTS)[number];

export function canonicalToLegacyPart(p: CanonicalPart): LegacyPart {
  const out: LegacyPart = {
    Name: p.identity.name,
    Kind: p.identity.kind,
    ID: p.identity.id,
  };
  if (p.identity.manufacturer != null) {
    out.Manufacturer = p.identity.manufacturer;
  }
  if (p.identity.description != null) {
    out.Description = p.identity.description;
  }
  for (const [k, v] of Object.entries(p.baseStats)) {
    out[k] = v;
  }
  for (const [k, v] of Object.entries(p.scalingModels)) {
    out[k] = v;
  }
  if (typeof out.Weight !== "number" || !Number.isFinite(out.Weight)) {
    out.Weight = 0;
  }
  if (typeof out.ENLoad !== "number" || !Number.isFinite(out.ENLoad)) {
    out.ENLoad = 0;
  }
  return out;
}

export function assemblyToLegacyMap(assembly: BuildAssembly): AcPartsMap {
  const out: Record<string, LegacyPart> = {};
  for (const slot of REQUIRED_ASSEMBLY_SLOTS) {
    const part = assembly[slot];
    if (part == null) {
      throw new Error(`Missing required assembly slot: ${slot}`);
    }
    out[slot] = canonicalToLegacyPart(part);
  }
  out.expansion =
    assembly.expansion != null
      ? canonicalToLegacyPart(assembly.expansion)
      : LEGACY_NONE_EXPANSION;
  return out as AcPartsMap;
}
