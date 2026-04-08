import type { LegacyStatGroup } from "../types";

/**
 * Reads FCS close/medium/long assists from `computeAllStats` group 1
 * (`AimAssistGraph`, type RangePlot).
 */
export function parseAimAssistGraph(
  groups: readonly LegacyStatGroup[],
): { close: number; medium: number; long: number } | null {
  const g1 = groups[1];
  if (!g1) return null;
  const row = g1.find((s) => s.name === "AimAssistGraph");
  const v = row?.value;
  if (!Array.isArray(v) || v.length < 7) return null;
  const close = Number(v[4]);
  const medium = Number(v[5]);
  const long = Number(v[6]);
  if (![close, medium, long].every((n) => Number.isFinite(n))) return null;
  return { close, medium, long };
}
