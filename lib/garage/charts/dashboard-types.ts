/** View models for garage ECharts dashboard (from blueprint, trimmed to AC6 stats). */

export type DefensiveRadarRaw = {
  ap: number;
  effectiveAp: number;
  stability: number;
  kineticDef: number;
  energyDef: number;
  explosiveDef: number;
};

export type EnergyMeterModel = {
  enLoadPct: number;
  generatorEfficiencyPct: number;
  boosterDemandPct: number;
  redlineRiskPct: number;
};

export type RecoilThresholds = {
  stable: number;
  unstable: number;
  break: number;
};

export const DEFAULT_RECOIL_THRESHOLDS: RecoilThresholds = {
  stable: 32,
  unstable: 64,
  break: 96,
};

export const MATCHUP_ROWS = [
  "Rushdown",
  "Midrange",
  "Tank",
  "Missile boat",
  "Hover kite",
] as const;

export const MATCHUP_COLS = [
  "Neutral",
  "Pressure",
  "Sustain",
  "Escape",
] as const;

export type MatchupHeatmapModel = {
  /** Row-major [row][col] scores 0–100. */
  scores: number[][];
  /** Optional per-cell notes for tooltips. */
  notes?: (string | undefined)[][];
  summary: string;
};
