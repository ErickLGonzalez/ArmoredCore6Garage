import { REQUIRED_ASSEMBLY_SLOTS } from "@/lib/calc/assembly-map";
import type { AssemblySlot } from "@/lib/calc/types";
import type { CanonicalPart } from "@/lib/schema";

const WEAPON_SLOTS = [
  "rightArm",
  "leftArm",
  "rightBack",
  "leftBack",
] as const satisfies readonly AssemblySlot[];

type WeaponSlot = (typeof WEAPON_SLOTS)[number];

function isWeaponSlot(slot: AssemblySlot): slot is WeaponSlot {
  return (WEAPON_SLOTS as readonly string[]).includes(slot);
}

function unitFitsWeaponSlot(part: CanonicalPart, slot: WeaponSlot): boolean {
  if (part.identity.kind !== "Unit") return false;
  const bs = part.baseStats;
  switch (slot) {
    case "rightArm":
      return bs.RightArm === true;
    case "leftArm":
      return bs.LeftArm === true;
    case "rightBack":
      return bs.RightBack === true;
    case "leftBack":
      return bs.LeftBack === true;
    default:
      return false;
  }
}

const FRAME_KIND: Record<
  Exclude<AssemblySlot, WeaponSlot | "expansion">,
  string
> = {
  head: "Head",
  core: "Core",
  arms: "Arms",
  legs: "Legs",
  booster: "Booster",
  fcs: "FCS",
  generator: "Generator",
};

/** Parts allowed in a given assembly slot (legacy slot rules). */
export function partsForSlot(
  allParts: readonly CanonicalPart[],
  slot: AssemblySlot,
): CanonicalPart[] {
  if (isWeaponSlot(slot)) {
    return allParts.filter((p) => unitFitsWeaponSlot(p, slot));
  }
  if (slot === "expansion") {
    return allParts.filter((p) => p.identity.kind === "Expansion");
  }
  const kind = FRAME_KIND[slot as keyof typeof FRAME_KIND];
  return allParts.filter((p) => p.identity.kind === kind);
}

export type RequiredSlot = (typeof REQUIRED_ASSEMBLY_SLOTS)[number];

export const SLOT_LABELS: Record<RequiredSlot, string> = {
  rightArm: "Right arm",
  leftArm: "Left arm",
  rightBack: "Right back",
  leftBack: "Left back",
  head: "Head",
  core: "Core",
  arms: "Arms",
  legs: "Legs",
  booster: "Booster",
  fcs: "FCS",
  generator: "Generator",
};

export const EXPANSION_SLOT_LABEL = "Expansion";

export function sortPartsByName(parts: CanonicalPart[]): CanonicalPart[] {
  return [...parts].sort((a, b) =>
    a.identity.name.localeCompare(b.identity.name, undefined, {
      sensitivity: "base",
    }),
  );
}
