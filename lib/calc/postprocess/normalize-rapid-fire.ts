import { SINGLE_BULLET_RAPID_FIRE_UNITS } from "./constants";

/**
 * Match DataFuncs.normalizeRapidFire — adjusts rapid fire for bullet groups and lock timing.
 */
export function normalizeRapidFire(
  name: string,
  rapidFire: number,
  rawAtkPwr: unknown,
  lockDelay: number,
  lockTime: number,
): [number, number] {
  const bulletGroupSize = Array.isArray(rawAtkPwr)
    ? (typeof rawAtkPwr[1] === "number" ? rawAtkPwr[1] : 1)
    : 1;
  let rf = rapidFire;
  if (SINGLE_BULLET_RAPID_FIRE_UNITS.includes(name as (typeof SINGLE_BULLET_RAPID_FIRE_UNITS)[number])) {
    rf /= bulletGroupSize;
  }
  if (!Number.isNaN(rf) && !Number.isNaN(lockDelay)) {
    const rapidFireInterval = 1 / rf;
    rf = 1 / Math.max(rapidFireInterval, lockDelay + lockTime);
  }
  return [rf, bulletGroupSize];
}
