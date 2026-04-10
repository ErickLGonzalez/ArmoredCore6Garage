import type { EnergyRecoveryCurves } from "@/lib/garage/plot-data";
import type { DefensiveRadarRaw } from "@/lib/garage/charts/dashboard-types";
import type { MatchupHeatmapModel } from "@/lib/garage/charts/dashboard-types";

/** Piecewise aim assist points [m, assist]. */
export function summarizeCombatEnvelopeFromPoints(
  points: [number, number][],
): string {
  if (points.length === 0) return "";
  let maxA = 0;
  let maxM = 0;
  for (const [m, a] of points) {
    if (a > maxA) {
      maxA = a;
      maxM = m;
    }
  }
  const hi = points.filter(([, a]) => a >= maxA * 0.88);
  const lo = hi.length ? Math.min(...hi.map(([m]) => m)) : 0;
  const hiM = hi.length ? Math.max(...hi.map(([m]) => m)) : maxM;
  const drop = points.findIndex(
    ([m, a], i) => i > 0 && a < maxA * 0.55 && m > hiM,
  );
  const dropM = drop >= 0 ? points[drop]![0] : null;
  let t = `Peak assist ~${maxA.toFixed(0)} near ${maxM}m; strong band about ${lo}–${hiM}m.`;
  if (dropM != null) t += ` Tracking falls off noticeably after ~${dropM}m.`;
  return t;
}

export function summarizeEnergyFromCurves(curves: EnergyRecoveryCurves): string {
  const nd = curves.normal.t[0] ?? 0;
  const rd = curves.redline.t[0] ?? 0;
  const nFull = curves.normal.t[2] ?? 0;
  const rFull = curves.redline.t[2] ?? 0;
  let t = "";
  if (rd > nd + 0.05) {
    t += `Redline starts ${(rd - nd).toFixed(2)}s slower than normal recovery. `;
  }
  if (rFull > nFull * 1.15) {
    t += `Full redline recharge is stretched vs normal (${rFull.toFixed(1)}s vs ${nFull.toFixed(1)}s).`;
  } else {
    t += `Normal full recharge ~${nFull.toFixed(1)}s; economy looks ${rFull <= nFull * 1.08 ? "stable" : "manageable"} under redline.`;
  }
  return t.trim();
}

export function summarizeDefense(data: DefensiveRadarRaw): string {
  const defs = [
    ["kinetic", data.kineticDef],
    ["energy", data.energyDef],
    ["explosive", data.explosiveDef],
  ] as const;
  const min = defs.reduce((a, b) => (b[1] < a[1] ? b : a));
  const max = defs.reduce((a, b) => (b[1] > a[1] ? b : a));
  return `Effective AP ~${Math.round(data.effectiveAp)} on ${Math.round(data.ap)} AP frame; lowest lane is ${min[0]} (${min[1].toFixed(0)}). Strongest: ${max[0]} (${max[1].toFixed(0)}). Stability ${Math.round(data.stability)}.`;
}

export function summarizeMatchups(data: MatchupHeatmapModel): string {
  return data.summary;
}

export function summarizeRecoilTimeline(
  maxRecoil: number,
  thresholds: { stable: number; unstable: number; break: number },
): string {
  if (maxRecoil < thresholds.stable) {
    return `Peak recoil stays under the stable band (<${thresholds.stable}).`;
  }
  if (maxRecoil < thresholds.unstable) {
    return `Recoil enters the mid band but stays below unstable (${thresholds.unstable}).`;
  }
  if (maxRecoil < thresholds.break) {
    return `Recoil approaches unstable; peak ${maxRecoil.toFixed(0)} vs break at ${thresholds.break}.`;
  }
  return `Recoil exceeds the break threshold (${thresholds.break}) in this window — expect strong spread.`;
}
