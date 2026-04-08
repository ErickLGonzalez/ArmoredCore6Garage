export type RangeBand = "close" | "mid" | "long";

export type FullAccuracyConfig = {
  /**
   * Engagement distance in metres (0–320), matching legacy aim-assist plot x-axis.
   * When omitted, `rangeBand` picks a default distance.
   */
  distanceM?: number;
  /** Used when `distanceM` is omitted. */
  rangeBand?: RangeBand;
};

/** Structured combat-side preview; DPS term is a documented heuristic, not in-game exact. */
export type FullAccuracyResult = {
  engagementDistanceM: number;
  /** FCS assist value at `engagementDistanceM` (legacy plot y-scale, ~0–95). */
  fcsAssist: number;
  targetTracking: number;
  averageRecoil: number;
  /** Echoes `rangeBand` when that was used to pick distance (for UI). */
  rangeBand?: RangeBand;
  /**
   * Heuristic: `dps × recoilMod × trackingMod × fcsAssistMod`.
   * Does not model projectile travel, lock time, or per-weapon falloff tables.
   */
  effectiveDpsEstimate: number;
};
