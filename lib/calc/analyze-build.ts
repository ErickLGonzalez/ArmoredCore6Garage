import { assemblyToLegacyMap } from "./assembly-map";
import { computeAllStats, findLegacyStat } from "./compute-all-stats";
import type { BuildAssembly, LegacyPart, LegacyStatGroup } from "./types";

/** Flat numeric summary for APIs; full parity lives in `groups`. */
export type BuildAnalysis = {
  groups: LegacyStatGroup[];
  totalWeight: number;
  totalEnLoad: number;
  totalAp: number;
  /** Mean of kinetic / energy / explosive frame defenses. */
  totalDef: number;
  totalStability: number;
  groundedBoostSpeed: number;
  qbReload: number;
  enSupplyEfficiency: number;
  dps: number;
  burstDps: number;
  impactPerSecond: number;
  accumulativeImpactPerSecond: number;
};

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Read a numeric weapon/frame stat from a legacy part (handles string JSON edge cases). */
function legacyNumeric(part: LegacyPart, key: string): number {
  const v = part[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Legacy-parity AC analysis: same grouping as reference `computeAllStats`.
 * Weapon DPS / IPS aggregates are not summed here yet (multi-weapon policy TBD).
 */
export function analyzeBuild(assembly: BuildAssembly): BuildAnalysis {
  const map = assemblyToLegacyMap(assembly);
  const groups = computeAllStats(map);

  const ra = map.rightArm;
  const la = map.leftArm;
  const rb = map.rightBack;
  const lb = map.leftBack;

  const dpsVals = [ra, la, rb, lb].map((u) => legacyNumeric(u, "Damage/s"));
  const burstVals = [ra, la, rb, lb].map((u) =>
    legacyNumeric(u, "Damage/sInclReload"),
  );
  const ipsVals = [ra, la, rb, lb].map((u) => legacyNumeric(u, "Impact/s"));
  const accIpsVals = [ra, la, rb, lb].map((u) =>
    legacyNumeric(u, "AccumulativeImpact/s"),
  );

  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

  const defenses = [
    num(findLegacyStat(groups, "AntiKineticDefense")),
    num(findLegacyStat(groups, "AntiEnergyDefense")),
    num(findLegacyStat(groups, "AntiExplosiveDefense")),
  ];

  return {
    groups,
    totalWeight: num(findLegacyStat(groups, "TotalWeight")),
    totalEnLoad: num(findLegacyStat(groups, "TotalENLoad")),
    totalAp: num(findLegacyStat(groups, "AP")),
    totalDef: defenses.reduce((a, b) => a + b, 0) / defenses.length,
    totalStability: num(findLegacyStat(groups, "AttitudeStability")),
    groundedBoostSpeed: num(findLegacyStat(groups, "GroundedBoostSpeed")),
    qbReload: num(findLegacyStat(groups, "QBReloadTime")),
    enSupplyEfficiency: num(findLegacyStat(groups, "ENSupplyEfficiency")),
    dps: sum(dpsVals),
    burstDps: sum(burstVals),
    impactPerSecond: sum(ipsVals),
    accumulativeImpactPerSecond: sum(accIpsVals),
  };
}
