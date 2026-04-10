import type { WeaponFxFamily } from "./types";

export type FamilyTuning = {
  impactMul: number;
  enMul: number;
  cooldownMul: number;
};

export type SimulationTuning = Record<WeaponFxFamily, FamilyTuning>;

export const DEFAULT_SIM_TUNING: SimulationTuning = {
  kinetic: { impactMul: 1, enMul: 1, cooldownMul: 1 },
  laser: { impactMul: 1, enMul: 1, cooldownMul: 1 },
  explosive: { impactMul: 1, enMul: 1, cooldownMul: 1 },
};

export function tuningFor(
  tuning: SimulationTuning,
  family: WeaponFxFamily,
): FamilyTuning {
  return tuning[family] ?? DEFAULT_SIM_TUNING.kinetic;
}
