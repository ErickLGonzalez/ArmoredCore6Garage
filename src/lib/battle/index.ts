export function simulateBattle(_buildA: unknown, _buildB: unknown) {
  return {
    mode: "stub",
    winner: null as "A" | "B" | null,
    durationSec: 0,
    events: [] as string[],
  };
}
