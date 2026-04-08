/** Maps average recoil (0–100 scale from simulation) to a damage multiplier. */
export function recoilDamageMultiplier(averageRecoil: number): number {
  const r = Math.max(0, Math.min(100, averageRecoil));
  return Math.max(0.2, 1 - r / 200);
}
