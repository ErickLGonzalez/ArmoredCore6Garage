import { describe, expect, it } from "vitest";

import {
  analyzeBuild,
  computeFullAccuracy,
  fcsAssistAtDistance,
  rangeBandDefaultDistanceM,
  recoilDamageMultiplier,
} from "@/lib/calc";
import { normalizeRawPart } from "@/lib/data/normalize-part";

function minimalAssembly() {
  const u = (n: string) =>
    normalizeRawPart(
      { Name: n, Kind: "Unit", Weight: 0, ENLoad: 0 },
      0,
      "t.json",
    );
  const head = normalizeRawPart(
    { Name: "H", Kind: "Head", Weight: 1000, ENLoad: 10, AP: 100 },
    1,
    "t.json",
  );
  const core = normalizeRawPart(
    {
      Name: "C",
      Kind: "Core",
      Weight: 2000,
      ENLoad: 20,
      AP: 200,
      BoosterEfficiencyAdj: 100,
      GeneratorOutputAdj: 100,
      GeneratorSupplyAdj: 100,
    },
    2,
    "t.json",
  );
  const arms = normalizeRawPart(
    {
      Name: "A",
      Kind: "Arms",
      Weight: 500,
      ENLoad: 5,
      AP: 50,
      ArmsLoadLimit: 10000,
      RecoilControl: 150,
      FirearmSpecialization: 100,
    },
    3,
    "t.json",
  );
  const legs = normalizeRawPart(
    {
      Name: "L",
      Kind: "Legs",
      Weight: 3000,
      ENLoad: 10,
      AP: 300,
      LoadLimit: 50000,
      LegType: "Bipedal",
      AntiKineticDefense: 100,
      AntiEnergyDefense: 100,
      AntiExplosiveDefense: 100,
      AttitudeStability: 50,
    },
    4,
    "t.json",
  );
  const booster = normalizeRawPart(
    {
      Name: "B",
      Kind: "Booster",
      Weight: 200,
      ENLoad: 50,
      Thrust: 100,
      QBThrust: 100,
      UpwardThrust: 100,
      ABThrust: 100,
      MeleeAttackThrust: 100,
      QBReloadTime: 1,
      QBReloadIdealWeight: 0,
      QBENConsumption: 100,
      QBJetDuration: 0.1,
      UpwardENConsumption: 1,
      ABENConsumption: 1,
    },
    5,
    "t.json",
  );
  const fcs = normalizeRawPart(
    {
      Name: "F",
      Kind: "FCS",
      Weight: 0,
      ENLoad: 5,
      CloseRangeAssist: 0,
      MediumRangeAssist: 0,
      LongRangeAssist: 0,
    },
    6,
    "t.json",
  );
  const gen = normalizeRawPart(
    {
      Name: "G",
      Kind: "Generator",
      Weight: 0,
      ENLoad: 10,
      ENCapacity: 10000,
      ENOutput: 8000,
      ENRecharge: 100,
      SupplyRecovery: 100,
      PostRecoveryENSupply: 0,
    },
    7,
    "t.json",
  );
  return {
    rightArm: u("r1"),
    leftArm: u("r2"),
    rightBack: u("r3"),
    leftBack: u("r4"),
    head,
    core,
    arms,
    legs,
    booster,
    fcs,
    generator: gen,
  };
}

describe("M4 accuracy", () => {
  it("fcsAssistAtDistance matches legacy RangePlot breakpoints", () => {
    const c = 30;
    const m = 60;
    const l = 90;
    expect(fcsAssistAtDistance(0, c, m, l)).toBe(c);
    expect(fcsAssistAtDistance(120, c, m, l)).toBe(c);
    expect(fcsAssistAtDistance(140, c, m, l)).toBe(m);
    expect(fcsAssistAtDistance(200, c, m, l)).toBe(m);
    expect(fcsAssistAtDistance(270, c, m, l)).toBe(l);
    expect(fcsAssistAtDistance(320, c, m, l)).toBe(l);
    expect(fcsAssistAtDistance(130, c, m, l)).toBeCloseTo(c + (m - c) * 0.5);
  });

  it("rangeBandDefaultDistanceM", () => {
    expect(rangeBandDefaultDistanceM("close")).toBe(60);
    expect(rangeBandDefaultDistanceM("long")).toBe(300);
  });

  it("recoilDamageMultiplier bounds", () => {
    expect(recoilDamageMultiplier(0)).toBe(1);
    expect(recoilDamageMultiplier(100)).toBeLessThan(1);
  });

  it("computeFullAccuracy returns structured output", () => {
    const analysis = analyzeBuild(minimalAssembly());
    const acc = computeFullAccuracy(analysis, { rangeBand: "mid" });
    expect(acc.rangeBand).toBe("mid");
    expect(acc.engagementDistanceM).toBe(180);
    expect(typeof acc.fcsAssist).toBe("number");
    expect(Number.isFinite(acc.effectiveDpsEstimate)).toBe(true);
  });

  it("computeFullAccuracy respects distanceM over rangeBand", () => {
    const analysis = analyzeBuild(minimalAssembly());
    const a = computeFullAccuracy(analysis, {
      distanceM: 10,
      rangeBand: "long",
    });
    expect(a.engagementDistanceM).toBe(10);
    expect(a.rangeBand).toBeUndefined();
  });
});
