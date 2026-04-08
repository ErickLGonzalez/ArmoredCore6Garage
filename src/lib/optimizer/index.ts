export type OptimizeGoal =
  | "max_dps"
  | "max_stagger"
  | "max_mobility"
  | "balanced";

export type OptimizeConfig = {
  goal: OptimizeGoal;
};

export function optimizeAdvanced(_config: OptimizeConfig) {
  return {
    mode: "stub",
    candidates: [],
  };
}
