import type { LegacyStatGroup } from "@/lib/calc/types";

/** `AimAssistGraph` row value: 4 weapon ranges + 3 FCS assists. */
export function getAimAssistPlotData(
  groups: readonly LegacyStatGroup[],
): number[] | null {
  const row = groups[1]?.find((s) => s.name === "AimAssistGraph");
  const v = row?.value;
  if (!Array.isArray(v) || v.length < 7) return null;
  return v.map((x) => (x === null || x === undefined ? NaN : Number(x)));
}

export function getRecoilPlotPoints(
  groups: readonly LegacyStatGroup[],
): [number, number][] | null {
  const row = groups[1]?.find((s) => s.name === "RecoilAccumulationGraph");
  const v = row?.value;
  if (!Array.isArray(v) || v.length === 0) return null;
  const out: [number, number][] = [];
  for (const pt of v) {
    if (!Array.isArray(pt) || pt.length < 2) return null;
    const x = Number(pt[0]);
    const y = Number(pt[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    out.push([x, y]);
  }
  return out;
}
