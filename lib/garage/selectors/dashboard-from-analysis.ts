import type { BuildAnalysis } from "@/lib/calc";
import { findLegacyStat } from "@/lib/calc/compute-all-stats";
import type {
  DefensiveRadarRaw,
  EnergyMeterModel,
  MatchupHeatmapModel,
} from "@/lib/garage/charts/dashboard-types";
import {
  MATCHUP_COLS,
  MATCHUP_ROWS,
} from "@/lib/garage/charts/dashboard-types";

function num(groups: BuildAnalysis["groups"], name: string): number {
  const v = findLegacyStat(groups, name);
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function selectEnOutput(analysis: BuildAnalysis): number {
  return num(analysis.groups, "ENOutput");
}

export function selectDefensiveRadarRaw(
  analysis: BuildAnalysis,
): DefensiveRadarRaw {
  const g = analysis.groups;
  return {
    ap: num(g, "AP"),
    effectiveAp: num(g, "EffectiveAPAvg"),
    stability: num(g, "AttitudeStability"),
    kineticDef: num(g, "AntiKineticDefense"),
    energyDef: num(g, "AntiEnergyDefense"),
    explosiveDef: num(g, "AntiExplosiveDefense"),
  };
}

export function selectEnergyMeterModel(
  analysis: BuildAnalysis,
): EnergyMeterModel | null {
  const g = analysis.groups;
  const enOut = num(g, "ENOutput");
  const enLoad = num(g, "TotalENLoad");
  const cap = num(g, "ENCapacity");
  const qbCost = num(g, "QBENConsumption");
  const eff = num(g, "ENSupplyEfficiency");
  const fullN = num(g, "FullRechargeTime");
  const fullR = num(g, "FullRechargeTimeRedline");

  if (enOut <= 0 && cap <= 0) return null;

  const enLoadPct =
    enOut > 0 ? Math.min(100, (enLoad / enOut) * 100) : Math.min(100, enLoad / 50);

  const generatorEfficiencyPct = Math.min(100, Math.max(0, eff));
  const boosterDemandPct =
    cap > 0 ? Math.min(100, (qbCost / cap) * 100) : Math.min(100, qbCost / 2);

  const redlineRatio =
    fullN > 0 && fullR > 0 ? fullR / fullN : fullR > 0 ? 1.4 : 1;
  const redlineRiskPct = Math.min(
    100,
    enLoadPct * 0.45 + Math.max(0, redlineRatio - 1) * 35 + (100 - generatorEfficiencyPct) * 0.15,
  );

  return {
    enLoadPct,
    generatorEfficiencyPct,
    boosterDemandPct,
    redlineRiskPct,
  };
}

function clampScore(n: number): number {
  return Math.round(Math.max(12, Math.min(96, n)));
}

/** Heuristic matchup grid from aggregate build stats (not sim-backed). */
export function selectMatchupHeatmapModel(
  analysis: BuildAnalysis,
): MatchupHeatmapModel {
  const w = analysis.totalWeight;
  const ap = analysis.totalAp;
  const def = analysis.totalDef;
  const stab = analysis.totalStability;
  const boost = analysis.groundedBoostSpeed;
  const qb = analysis.qbReload;
  const burst = analysis.burstDps;
  const dps = analysis.dps;
  const accIps = analysis.accumulativeImpactPerSecond;
  const enLoad = analysis.totalEnLoad;
  const enEff = analysis.enSupplyEfficiency;

  const light = w < 88_000;
  const heavy = w > 118_000;
  const mobile = boost > 320 && qb < 0.45;
  const tanky = ap > 38_000 && def > 55;
  const brawler = burst > 2200 && dps > 1800;

  const scores: number[][] = MATCHUP_ROWS.map((row) =>
    MATCHUP_COLS.map((col) => {
      let s = 48;
      if (row === "Rushdown") {
        s += mobile ? 18 : -6;
        s += brawler ? 14 : -4;
        s += light ? 8 : heavy ? -10 : 0;
        if (col === "Pressure") s += 12;
        if (col === "Escape") s += mobile ? 6 : -8;
        if (col === "Sustain") s += tanky ? 4 : -6;
      } else if (row === "Midrange") {
        s += 6;
        s += stab > 120 ? 8 : -4;
        if (col === "Neutral") s += 10;
        if (col === "Pressure") s += accIps > 120 ? 10 : 4;
      } else if (row === "Tank") {
        s += tanky ? 22 : -12;
        if (col === "Sustain") s += 18;
        if (col === "Escape") s += heavy ? -14 : 4;
        if (col === "Pressure") s += brawler ? 6 : -4;
      } else if (row === "Missile boat") {
        s += accIps > 140 ? 20 : accIps > 80 ? 10 : -6;
        if (col === "Pressure") s += 12;
        if (col === "Neutral") s += 4;
      } else if (row === "Hover kite") {
        s += mobile ? 16 : -10;
        s += light ? 10 : heavy ? -12 : 0;
        if (col === "Escape") s += 16;
        if (col === "Sustain") s += enEff > 85 ? 6 : -8;
      }

      if (col === "Sustain") {
        s += enLoad < 2800 && enEff > 80 ? 8 : enLoad > 4000 ? -10 : 0;
      }
      if (col === "Pressure") {
        s += dps > 2000 ? 8 : -4;
      }

      return clampScore(s);
    }),
  );

  const summary =
    tanky && !mobile
      ? "Slow, durable shell — strong in sustain rows; watch rushdown and escape pressure."
      : mobile && light
        ? "High mobility — hover kite and escape columns trend up; tank row may lag."
        : brawler
          ? "High burst — pressure and rushdown interactions skew favorable if EN holds."
          : "Balanced profile — read the heatmap for where this build leans.";

  return { scores, summary };
}

export function selectWeightClassLabel(
  analysis: BuildAnalysis,
): "LIGHT" | "MID" | "HEAVY" {
  const w = analysis.totalWeight;
  if (w < 90_000) return "LIGHT";
  if (w > 120_000) return "HEAVY";
  return "MID";
}

export function selectArchetypeTags(analysis: BuildAnalysis): string[] {
  const tags: string[] = [];
  if (analysis.burstDps > 2200) tags.push("Burst");
  if (analysis.groundedBoostSpeed > 330) tags.push("Mobile");
  if (analysis.totalAp > 40_000) tags.push("Tanky");
  if (analysis.accumulativeImpactPerSecond > 140) tags.push("Stagger");
  if (analysis.totalEnLoad > 4000) tags.push("EN load");
  if (tags.length === 0) tags.push("Generalist");
  return tags.slice(0, 5);
}
