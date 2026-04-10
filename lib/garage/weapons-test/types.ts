export type Vec3 = { x: number; y: number; z: number };

export type WeaponFxFamily = "kinetic" | "laser" | "explosive";

export type WeaponTestEvent =
  | {
      type: "weapon_fired";
      weaponId: string;
      family: WeaponFxFamily;
      origin: Vec3;
      t: number;
    }
  | {
      type: "projectile_impact";
      weaponId: string;
      family: WeaponFxFamily;
      target: Vec3;
      t: number;
      impact: number;
    }
  | { type: "energy_spent"; amount: number; t: number }
  | { type: "stagger_added"; amount: number; total: number; t: number }
  | { type: "stagger_triggered"; t: number }
  | { type: "reload_started"; weaponId: string; t: number };

export type WeaponsTestSimulationState = {
  time: number;
  currentEnergy: number;
  maxEnergy: number;
  targetStagger: number;
  targetStaggerMax: number;
  targetMode: "dummy" | "compare";
  activeWeaponId: string | null;
  /** Per-weapon reload timers (seconds remaining). */
  weaponCooldowns: Record<string, number>;
  events: WeaponTestEvent[];
  /** Impacts resolved when `time` crosses `t`. */
  pendingImpacts: {
    t: number;
    weaponId: string;
    family: WeaponFxFamily;
    impact: number;
  }[];
};

export type WeaponLoadoutEntry = {
  id: string;
  slot: string;
  name: string;
  family: WeaponFxFamily;
  /** Rough stagger contribution per trigger pull. */
  impactPerTrigger: number;
  enCost: number;
  cooldown: number;
};

/** Minimal shape for stagger cap on compare target. */
export type BuildAnalysisLike = { totalStability: number };

/** Inputs sampled each tick (not stored in simulation state). */
export type WeaponsTestTickInput = {
  fireHeld: boolean;
  autoFire: boolean;
  multiWeapon: boolean;
  /** When multi-weapon: only these ids fire. Null = all loadout weapons. */
  armedWeaponIds: Set<string> | null;
  activeWeaponId: string | null;
};

export type CreateWeaponsTestOptions = {
  primaryWeaponId: string | null;
  targetMode: "dummy" | "compare";
  targetAnalysis?: BuildAnalysisLike | null;
};
