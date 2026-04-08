import { REQUIRED_ASSEMBLY_SLOTS } from "@/lib/calc/assembly-map";
import type { RequiredAssemblySlot } from "@/lib/calc/assembly-map";

import type { GarageBuildIds } from "./default-assembly";

const N = REQUIRED_ASSEMBLY_SLOTS.length + 1;

/** Compact build encoding: 11 core slots + expansion, hyphen-separated part IDs. */
export function encodeGarageBuild(sel: GarageBuildIds): string {
  const parts: number[] = REQUIRED_ASSEMBLY_SLOTS.map((s) => sel[s]);
  parts.push(sel.expansionId);
  return parts.join("-");
}

export function decodeGarageBuild(
  encoded: string | null | undefined,
  validIds: ReadonlySet<number>,
  fallback: GarageBuildIds,
): GarageBuildIds {
  if (encoded == null || !String(encoded).trim()) return { ...fallback };
  const raw = String(encoded).trim().split("-");
  if (raw.length !== N) return { ...fallback };
  const ids = raw.map((x) => Number(x));
  if (ids.some((n) => !Number.isInteger(n) || n < 0)) return { ...fallback };
  if (ids.some((id) => !validIds.has(id))) return { ...fallback };
  const out = { ...fallback };
  let i = 0;
  for (const s of REQUIRED_ASSEMBLY_SLOTS) {
    out[s as RequiredAssemblySlot] = ids[i++]!;
  }
  out.expansionId = ids[i]!;
  return out;
}
