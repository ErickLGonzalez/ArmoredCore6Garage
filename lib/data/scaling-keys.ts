/**
 * Keys moved into `scalingModels` (charge, heat, specialization, cadence).
 * Everything else (after identity strip) lives in `baseStats`.
 */
export function isScalingModelKey(key: string): boolean {
  if (key.startsWith("Chg") || key.startsWith("FullChg")) return true;
  if (key === "ATKHeatBuildup") return true;
  if (key.endsWith("Spec") || key.includes("RecoilAngle")) return true;
  if (key === "Cooling" || key === "CoolingDelay") return true;
  if (key === "RapidFire") return true;
  if (key === "ConsecutiveHits") return true;
  if (key === "ReloadTimeOverheat") return true;
  if (key === "PAInterference") return true;
  return false;
}
