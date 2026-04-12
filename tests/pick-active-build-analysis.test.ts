import { describe, expect, it } from "vitest";

import type { BuildAnalysis } from "@/lib/calc";
import { pickActiveBuildAnalysis } from "@/lib/garage/pick-active-build-analysis";

function stubAnalysis(totalAp: number): BuildAnalysis {
  return {
    groups: [],
    totalWeight: 0,
    totalEnLoad: 0,
    totalAp,
    totalDef: 0,
    totalStability: 0,
    groundedBoostSpeed: 0,
    qbReload: 0,
    enSupplyEfficiency: 0,
    dps: 0,
    burstDps: 0,
    impactPerSecond: 0,
    accumulativeImpactPerSecond: 0,
  };
}

describe("pickActiveBuildAnalysis", () => {
  it("returns null when base is null", () => {
    expect(
      pickActiveBuildAnalysis(null, stubAnalysis(99), true),
    ).toBeNull();
  });

  it("returns base when useModified is false", () => {
    const base = stubAnalysis(10);
    const mod = stubAnalysis(99);
    expect(pickActiveBuildAnalysis(base, mod, false)).toBe(base);
  });

  it("returns base when useModified is true but modified is null", () => {
    const base = stubAnalysis(10);
    expect(pickActiveBuildAnalysis(base, null, true)).toBe(base);
  });

  it("returns modified when useModified and modified are set", () => {
    const base = stubAnalysis(10);
    const mod = stubAnalysis(99);
    expect(pickActiveBuildAnalysis(base, mod, true)).toBe(mod);
  });
});
