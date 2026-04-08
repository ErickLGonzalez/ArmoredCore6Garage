import { REQUIRED_ASSEMBLY_SLOTS } from "@/lib/calc/assembly-map";
import type { BuildAssembly } from "@/lib/calc/types";
import type { CanonicalPart } from "@/lib/schema";

import type { GarageBuildIds } from "./default-assembly";

export function assemblyFromGarageIds(
  ids: GarageBuildIds,
  byId: ReadonlyMap<number, CanonicalPart>,
): BuildAssembly | null {
  const a: BuildAssembly = {};
  for (const slot of REQUIRED_ASSEMBLY_SLOTS) {
    const part = byId.get(ids[slot]);
    if (!part) return null;
    a[slot] = part;
  }
  const ex = byId.get(ids.expansionId);
  if (!ex) return null;
  a.expansion = ex;
  return a;
}
