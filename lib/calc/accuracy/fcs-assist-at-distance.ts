/**
 * FCS aim assist vs distance, matching breakpoints used in the reference
 * `StatRows.jsx` RangePlot (x-axis metres, y-axis assist 0–95).
 *
 * Segments: flat close 0–120, ramp 120–140, flat medium 140–250, ramp 250–270, flat long 270–320.
 */
export function fcsAssistAtDistance(
  distanceM: number,
  closeAssist: number,
  mediumAssist: number,
  longAssist: number,
): number {
  const d = Math.max(0, Math.min(320, distanceM));
  if (d <= 120) return closeAssist;
  if (d <= 140) {
    return closeAssist + (mediumAssist - closeAssist) * ((d - 120) / 20);
  }
  if (d <= 250) return mediumAssist;
  if (d <= 270) {
    return mediumAssist + (longAssist - mediumAssist) * ((d - 250) / 20);
  }
  return longAssist;
}
