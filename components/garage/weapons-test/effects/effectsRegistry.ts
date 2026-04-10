import type { WeaponFxFamily } from "@/lib/garage/weapons-test/types";

import { explosivePreset } from "./presets/explosive";
import { kineticPreset } from "./presets/kinetic";
import { laserPreset } from "./presets/laser";

export type FxPreset = {
  muzzle: string;
  trail: string;
  impact: string;
  spark: string;
};

export function presetForFamily(family: WeaponFxFamily): FxPreset {
  switch (family) {
    case "laser":
      return laserPreset;
    case "explosive":
      return explosivePreset;
    default:
      return kineticPreset;
  }
}
