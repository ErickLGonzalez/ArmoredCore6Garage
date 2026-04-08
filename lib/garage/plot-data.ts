import type { LegacyStatGroup } from "@/lib/calc/types";

/** EN recovery polylines (legacy `getLinePoints` / `EnergyPlot`). */
export type EnergyRecoveryCurves = {
  normal: { t: number[]; en: number[] };
  redline: { t: number[]; en: number[] };
};

function linePoints(delay: number, gap: number, rate: number, enMax: number): {
  t: number[];
  en: number[];
} {
  const r = rate > 0 && Number.isFinite(rate) ? rate : 1e-9;
  const tMax = delay + (enMax - gap) / r;
  return {
    t: [delay, delay, tMax],
    en: [0, gap, enMax],
  };
}

function quadTuple(v: unknown): [number, number, number, number] | null {
  if (!Array.isArray(v) || v.length < 4) return null;
  const a = v.map((x) => Number(x));
  if (a.some((n) => !Number.isFinite(n))) return null;
  return [a[0]!, a[1]!, a[2]!, a[3]!];
}

/** Parses `ENRecoveryGraph` from `computeAllStats` group (type EnergyPlot). */
export function getEnergyRecoveryCurves(
  groups: readonly LegacyStatGroup[],
): EnergyRecoveryCurves | null {
  for (const g of groups) {
    const row = g.find((s) => s.name === "ENRecoveryGraph");
    const raw = row?.value;
    if (raw === null || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const n = quadTuple(o.normal);
    const r = quadTuple(o.redline);
    if (!n || !r) continue;
    return {
      normal: linePoints(n[0], n[1], n[2], n[3]),
      redline: linePoints(r[0], r[1], r[2], r[3]),
    };
  }
  return null;
}

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
