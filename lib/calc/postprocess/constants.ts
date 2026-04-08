/** Legacy none-parts appended by the reference garage (same as DataFuncs.js). */
export const NONE_UNIT_PRE = {
  Name: "(NOTHING)",
  Kind: "Unit",
  RightArm: true,
  LeftArm: true,
  RightBack: true,
  LeftBack: true,
  Weight: 0,
  ENLoad: 0,
} as const;

export const NONE_BOOSTER_PRE = {
  Name: "(NOTHING)",
  Kind: "Booster",
  Weight: 0,
  ENLoad: 0,
} as const;

export const NONE_EXPANSION_PRE = {
  Name: "(NOTHING)",
  Kind: "Expansion",
  Weight: 0,
  ENLoad: 0,
} as const;

export const SINGLE_BULLET_RAPID_FIRE_UNITS = [
  "45-091 ORBT",
  "BO-044 HUXLEY",
  "MA-E-210 ETSUJIN",
  "MA-E-211 SAMPU",
  "MA-J-201 RANSETSU-AR",
] as const;
