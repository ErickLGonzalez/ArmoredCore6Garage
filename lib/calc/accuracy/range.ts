import type { RangeBand } from "./types";

export type { RangeBand };

/** Representative engagement distance when only a coarse band is chosen (metres). */
export function rangeBandDefaultDistanceM(band: RangeBand): number {
  switch (band) {
    case "close":
      return 60;
    case "mid":
      return 180;
    case "long":
      return 300;
    default:
      return 180;
  }
}
