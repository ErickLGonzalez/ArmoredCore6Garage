import type { LegacyPart } from "./types";

/** Placeholder expansion when no bay part is equipped (legacy `(NOTHING)` expansion). */
export const LEGACY_NONE_EXPANSION: LegacyPart = {
  Name: "(NOTHING)",
  Kind: "Expansion",
  Weight: 0,
  ENLoad: 0,
};
