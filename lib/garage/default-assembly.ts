import type { CanonicalPart } from "@/lib/schema";

import type { RequiredSlot } from "./slot-options";

/** Same default as legacy `BuildImportExport` starter (11 slots). */
const STARTER_PARTS: readonly { slot: RequiredSlot; name: string; kind: string }[] =
  [
    { slot: "rightArm", name: "RF-024 TURNER", kind: "Unit" },
    { slot: "leftArm", name: "HI-32: BU-TT/A", kind: "Unit" },
    { slot: "rightBack", name: "BML-G1/P20MLT-04", kind: "Unit" },
    { slot: "leftBack", name: "(NOTHING)", kind: "Unit" },
    { slot: "head", name: "HC-2000 FINDER EYE", kind: "Head" },
    { slot: "core", name: "CC-2000 ORBITER", kind: "Core" },
    { slot: "arms", name: "AC-2000 TOOL ARM", kind: "Arms" },
    { slot: "legs", name: "2C-2000 CRAWLER", kind: "Legs" },
    { slot: "booster", name: "BST-G1/P10", kind: "Booster" },
    { slot: "fcs", name: "FCS-G1/P01", kind: "FCS" },
    { slot: "generator", name: "AG-J-098 JOSO", kind: "Generator" },
  ];

function findPartId(
  parts: readonly CanonicalPart[],
  name: string,
  kind: string,
): number | undefined {
  const p = parts.find(
    (x) => x.identity.name === name && x.identity.kind === kind,
  );
  return p?.identity.id;
}

/** Resolve default part IDs; returns `null` if any starter row is missing from the dataset. */
export function defaultAssemblySelection(
  parts: readonly CanonicalPart[],
): Record<RequiredSlot, number> | null {
  const out = {} as Record<RequiredSlot, number>;
  for (const { slot, name, kind } of STARTER_PARTS) {
    const id = findPartId(parts, name, kind);
    if (id === undefined) return null;
    out[slot] = id;
  }
  return out;
}

/** Core assembly plus expansion bay (matches `partSlots` in reference `Globals.js`). */
export type GarageBuildIds = Record<RequiredSlot, number> & { expansionId: number };

export function defaultGarageSelection(
  parts: readonly CanonicalPart[],
): GarageBuildIds | null {
  const base = defaultAssemblySelection(parts);
  if (!base) return null;
  const ex = findPartId(parts, "(NOTHING)", "Expansion");
  if (ex === undefined) return null;
  return { ...base, expansionId: ex };
}
