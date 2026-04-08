export type OptimizeGoal =
  | "max_dps"
  | "max_stagger"
  | "max_mobility"
  | "balanced";

export type OptimizeConfig = {
  goal: OptimizeGoal;
  limit?: number;
};

export type OptimizeCandidate<TBuild = unknown> = {
  build: TBuild;
  metrics: {
    dps: number;
    stagger: number;
    mobility: number;
  };
};

function score(goal: OptimizeGoal, c: OptimizeCandidate): number {
  switch (goal) {
    case "max_dps":
      return c.metrics.dps;
    case "max_stagger":
      return c.metrics.stagger;
    case "max_mobility":
      return c.metrics.mobility;
    case "balanced":
    default:
      return c.metrics.dps * 0.45 + c.metrics.stagger * 0.35 + c.metrics.mobility * 0.2;
  }
}

export function optimizeAdvanced<TBuild = unknown>(
  config: OptimizeConfig,
  candidates: OptimizeCandidate<TBuild>[],
) {
  const limit = Math.max(1, config.limit ?? 12);
  const ranked = [...candidates]
    .map((c) => ({ ...c, score: score(config.goal, c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    goal: config.goal,
    count: ranked.length,
    ranked,
  };
}
