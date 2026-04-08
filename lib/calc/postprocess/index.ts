import type { LegacyPart } from "../types";

import { addAdvancedUnitStats } from "./advanced-unit-stats";
import {
  NONE_BOOSTER_PRE,
  NONE_EXPANSION_PRE,
  NONE_UNIT_PRE,
} from "./constants";

/**
 * Same pipeline as DataFuncs.postprocessData: append none parts, assign IDs, enrich units.
 */
export function postprocessLegacyDataset(raw: LegacyPart[]): LegacyPart[] {
  let res: LegacyPart[] = raw.concat([
    { ...NONE_UNIT_PRE } as LegacyPart,
    { ...NONE_BOOSTER_PRE } as LegacyPart,
    { ...NONE_EXPANSION_PRE } as LegacyPart,
  ]);
  res = res.map((part, idx) => ({ ...part, ID: idx }));
  res = res.map((part) =>
    part.Kind === "Unit" ? addAdvancedUnitStats(part) : part,
  );
  return res;
}
