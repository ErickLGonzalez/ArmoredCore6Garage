import type { BuildAnalysis } from "../analyze-build";

import { parseAimAssistGraph } from "./aim-assist-graph";
import { fcsAssistAtDistance } from "./fcs-assist-at-distance";
import { rangeBandDefaultDistanceM } from "./range";
import { recoilDamageMultiplier } from "./recoil";
import type { FullAccuracyConfig, FullAccuracyResult, RangeBand } from "./types";

export type { FullAccuracyConfig, FullAccuracyResult, RangeBand };

const NEUTRAL_FCS = { close: 50, medium: 50, long: 50 };

function resolveDistanceM(config: FullAccuracyConfig): {
  distanceM: number;
  rangeBand?: RangeBand;
} {
  if (config.distanceM != null) {
    return {
      distanceM: Math.max(0, Math.min(320, config.distanceM)),
    };
  }
  const band: RangeBand = config.rangeBand ?? "mid";
  return {
    distanceM: rangeBandDefaultDistanceM(band),
    rangeBand: band,
  };
}

/**
 * Milestone 4 — compose tracking, recoil, and **FCS assist at distance** (legacy plot
 * breakpoints) into one preview object. Weapon DPS still comes from `analyzeBuild`.
 */
export function computeFullAccuracy(
  analysis: BuildAnalysis,
  config: FullAccuracyConfig,
): FullAccuracyResult {
  const g1 = analysis.groups[1] ?? [];
  const tracking = Number(
    g1.find((s) => s.name === "TargetTracking")?.value ?? 0,
  );
  const avgRecoil = Number(
    g1.find((s) => s.name === "AverageRecoil")?.value ?? 0,
  );

  const assists =
    parseAimAssistGraph(analysis.groups) ?? NEUTRAL_FCS;
  const { distanceM, rangeBand } = resolveDistanceM(config);
  const fcsAssist = fcsAssistAtDistance(
    distanceM,
    assists.close,
    assists.medium,
    assists.long,
  );

  const recMod = recoilDamageMultiplier(avgRecoil);
  const trackingMod = Math.min(1.2, Math.max(0, tracking) / 100);
  /** Legacy plot y-axis tops out around 95. */
  const assistMod = Math.max(0.15, fcsAssist / 95);

  return {
    engagementDistanceM: distanceM,
    fcsAssist,
    targetTracking: tracking,
    averageRecoil: avgRecoil,
    rangeBand,
    effectiveDpsEstimate:
      analysis.dps * recMod * trackingMod * assistMod,
  };
}
