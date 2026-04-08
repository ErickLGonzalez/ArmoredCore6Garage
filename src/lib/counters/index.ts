export type CounterCandidate<TBuild = unknown> = {
  build: TBuild;
  dps: number;
  impactPerSecond: number;
  mobility: number;
};

export function generateCounterBuilds<TBuild = unknown>(
  enemy: { totalAp: number; totalStability: number; groundedBoostSpeed: number },
  candidates: CounterCandidate<TBuild>[],
  limit = 8,
) {
  const ranked = [...candidates]
    .map((c) => {
      const dpsPressure = c.dps / Math.max(enemy.totalAp, 1);
      const staggerPressure = c.impactPerSecond / Math.max(enemy.totalStability, 1);
      const pace = c.mobility / Math.max(enemy.groundedBoostSpeed, 1);
      return {
        ...c,
        score: dpsPressure * 0.5 + staggerPressure * 0.35 + pace * 0.15,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));

  return { count: ranked.length, ranked };
}
