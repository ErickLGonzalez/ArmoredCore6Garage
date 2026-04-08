/**
 * Port of reference `ACStats.jsx` computeAllStats + helpers (parity target).
 */
import { LEGACY_NONE_EXPANSION } from "./legacy-none-parts";
import { mean, piecewiseLinear, total } from "./math";
import type { LegacyPart } from "./types";
import type { LegacyStatGroup } from "./types";

function statNumber(part: LegacyPart | undefined, key: string): number {
  if (part == null) return 0;
  const raw = part[key];
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function sumKeyOver(
  parts: Record<string, LegacyPart>,
  key: string,
  slots: string[],
): number {
  return slots.reduce(
    (acc, slot) => acc + statNumber(parts[slot], key),
    0,
  );
}

function getAttitudeRecovery(weight: number): number {
  const base = 100;
  const multiplier = piecewiseLinear(weight / 10000, [
    [4, 1.5],
    [6, 1.2],
    [8, 0.9],
    [11, 0.6],
    [14, 0.57],
  ]);
  return base * multiplier;
}

function getTargetTracking(firearmSpec: number, loadRatio: number): number {
  let result =
    100 *
    piecewiseLinear(firearmSpec, [
      [0, 0],
      [50, 0.8],
      [100, 0.9],
      [150, 1],
      [200, 1.2],
    ]);
  if (loadRatio > 1) {
    result *= piecewiseLinear(loadRatio, [
      [1, 1],
      [1.2, 0.5],
      [1.21, 0.3],
      [2, 0.05],
    ]);
  }
  return result;
}

function finiteNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

const getFiringIntervals = (unit: LegacyPart): number[] => {
  const rapid = finiteNumber(unit.RapidFire, 0);
  const rf = rapid > 0 ? rapid : 1e-6;
  if (unit.BurstFireInterval) {
    const atk = unit.AttackPower;
    if (!Array.isArray(atk) || atk.length < 2) {
      return [1 / rf];
    }
    const nBurstShots = finiteNumber(atk[1], 1);
    const res = Array<number>(nBurstShots - 1).fill(
      finiteNumber(unit.BurstFireInterval, 0.1),
    );
    res.push(nBurstShots / rf - total(res));
    return res;
  }
  return [1 / rf];
};

const simulationTime = 5;
const simulationShotOffset = 0.05;
const recoilExcludedUnits = [
  "FASAN/60E",
  "VE-60LCA",
  "VE-60LCB",
  "VP-60LCD",
  "VP-60LCS",
];

function generateShots(
  nShots: number,
  intervals: number[],
  offset: number,
  recoil: number,
): [number, number][] {
  if (intervals.length === 1) {
    const actualShots = Math.min(
      nShots,
      Math.floor((simulationTime - offset) / intervals[0]!) + 1,
    );
    return [...Array(actualShots).keys()].map((i) => [
      i * intervals[0]! + offset,
      recoil,
    ]);
  }
  let shots: [number, number][] = Array(nShots) as [number, number][];
  const nBursts = nShots / intervals.length;
  let k = -1;
  let time = offset;
  let breakEarly = false;
  for (let i = 0; i < nBursts && !breakEarly; i++) {
    for (let j = 0; j < intervals.length && !breakEarly; j++) {
      k++;
      shots[k] = [time, recoil];
      time += intervals[j]!;
      if (time > simulationTime) {
        shots = shots.slice(0, k + 1);
        breakEarly = true;
      }
    }
  }
  return shots;
}

function recoilSimulation(
  units: LegacyPart[],
  recoilControl: number,
): [number, [number, number][]] {
  if (units.length === 0) return [0, []];

  const recoilMult = piecewiseLinear(recoilControl, [
    [0, 1.2],
    [150, 0.9],
    [235, 0.8],
  ]);
  const reductionRate = piecewiseLinear(recoilControl, [
    [0, 10],
    [50, 60],
    [100, 80],
    [150, 160],
    [235, 200],
  ]);
  const reductionDelay = recoilControl === 45 ? 0.095 : 0.05;

  const shotsByUnit: [number, number][][] = Array(units.length);
  for (let i = 0; i < units.length; i++) {
    const u = units[i]!;
    const magSize = Math.max(0, Math.floor(finiteNumber(u.MagazineRounds, 0)));
    const mdt = finiteNumber(u.MagDumpTime, 0);
    const rt = finiteNumber(u.ReloadTime, 0);
    const cycleTime = Math.max(1e-6, mdt + rt);
    const nCycles = Math.ceil(simulationTime / cycleTime);
    const firingIntervals = getFiringIntervals(u);
    const shotRecoil = finiteNumber(u.Recoil, 0) * recoilMult;
    shotsByUnit[i] = [];
    for (let cycle = 0; cycle < nCycles; cycle++) {
      shotsByUnit[i] = shotsByUnit[i]!.concat(
        generateShots(
          magSize,
          firingIntervals,
          cycle * cycleTime + i * simulationShotOffset,
          shotRecoil,
        ),
      );
    }
  }

  const allShots = shotsByUnit.flat();
  if (allShots.length === 0) {
    return [0, []];
  }
  allShots.sort((a, b) => a[0] - b[0]);

  let recoilSum = 0;
  let time = 0;
  const plotPoints: [number, number][] = [];
  allShots.reduce((startRecoil, shot, pos) => {
    const [shotTime, shotRecoil] = shot;
    recoilSum += startRecoil;

    const nextShotTime =
      pos < allShots.length - 1 ? allShots[pos + 1]![0] : simulationTime;
    const shotWindow = nextShotTime - shotTime;
    const postShotRecoil = Math.min(100, startRecoil + shotRecoil);
    const reductionWindow = Math.max(0, shotWindow - reductionDelay);
    const endRecoil = Math.max(
      0,
      postShotRecoil - reductionWindow * reductionRate,
    );

    plotPoints.push([time, postShotRecoil]);
    if (reductionWindow > 0) {
      plotPoints.push([time + reductionDelay, postShotRecoil]);
      if (endRecoil === 0) {
        plotPoints.push([
          time + reductionDelay + postShotRecoil / reductionRate,
          0,
        ]);
      }
    }
    plotPoints.push([time + shotWindow, endRecoil]);
    time += shotWindow;

    return endRecoil;
  }, 0);

  return [recoilSum / allShots.length, plotPoints];
}

const boostBreakpoints = [
  [4, 1],
  [6.25, 0.925],
  [7.5, 0.85],
  [8, 0.775],
  [12, 0.65],
] as const;
const qbBreakpoints = [
  [4, 1],
  [6.25, 0.9],
  [7.5, 0.85],
  [8, 0.8],
  [12, 0.7],
] as const;
const overweightBreakpoints = [
  [1, 1],
  [1.05, 0.95],
  [1.1, 0.8],
  [1.3, 0.75],
  [1.5, 0.7],
] as const;

const speedBreakpoints: Record<
  string,
  [
    ReadonlyArray<readonly [number, number]>,
    ReadonlyArray<readonly [number, number]>,
  ]
> = {
  boostGrounded: [boostBreakpoints, overweightBreakpoints],
  boostGroundedFortaleza: [
    [
      [5, 1],
      [6.25, 0.94],
      [7.5, 0.86],
      [10, 0.75],
      [15, 0.6],
    ],
    overweightBreakpoints,
  ],
  boostGroundedTank: [
    [
      [5, 1],
      [7.5, 0.9],
      [10, 0.85],
      [12, 0.8],
      [14, 0.7],
    ],
    overweightBreakpoints,
  ],
  boostAerial: [boostBreakpoints, overweightBreakpoints],
  quickBoost: [qbBreakpoints, overweightBreakpoints],
  upwards: [
    [
      [4, 1],
      [6.25, 0.9],
      [7.5, 0.85],
      [8, 0.8],
      [12, 0.7],
    ],
    overweightBreakpoints,
  ],
  assaultBoost: [
    [
      [4, 1],
      [5, 0.95],
      [7.5, 0.9],
      [10, 0.7],
      [15, 0.55],
    ],
    overweightBreakpoints,
  ],
  meleeBoost: [
    [
      [4, 1],
      [6.25, 0.95],
      [7.5, 0.85],
      [8, 0.75],
      [12, 0.65],
    ],
    overweightBreakpoints,
  ],
  hover: [
    [
      [7, 1],
      [9, 0.9],
      [10, 0.85],
      [11, 0.75],
      [12, 0.7],
    ],
    [
      [1, 1],
      [1.05, 0.9],
      [1.1, 0.8],
      [1.3, 0.7],
      [1.5, 0.6],
    ],
  ],
  hoverQuickBoost: [
    qbBreakpoints,
    [
      [1, 1],
      [1.05, 0.75],
      [1.1, 0.5],
      [1.3, 0.25],
      [1.5, 0],
    ],
  ],
};

function getSpeedSpec(
  base: number,
  weight: number,
  loadRatio: number,
  breakpointsMult: ReadonlyArray<readonly [number, number]>,
  breakpointsOver: ReadonlyArray<readonly [number, number]>,
): number {
  let multiplier = piecewiseLinear(weight / 10000, breakpointsMult);
  if (loadRatio > 1) {
    multiplier *= piecewiseLinear(loadRatio, breakpointsOver);
  }
  return base * multiplier;
}

function getQBReloadTime(
  baseReloadTime: number,
  idealWeight: number,
  weight: number,
): number {
  const multiplier = piecewiseLinear((weight - idealWeight) / 10000, [
    [0, 1],
    [0.5, 1.1],
    [1, 1.3],
    [3, 3],
    [5, 3.5],
  ]);
  return baseReloadTime * multiplier;
}

function getENSupplyEfficiency(enOutput: number, enLoad: number): number {
  if (enLoad > enOutput) return 100;
  return piecewiseLinear(enOutput - enLoad, [
    [0, 1500],
    [1800, 9000],
    [3500, 16500],
  ]);
}

function getRechargeDelays(
  generator: LegacyPart,
  core: LegacyPart,
): { normal: number; redline: number } {
  const factor = 2 - (core.GeneratorSupplyAdj as number) / 100;
  return {
    normal: (1000 / (generator.ENRecharge as number)) * factor,
    redline: (1000 / (generator.SupplyRecovery as number)) * factor,
  };
}

function timeToRecoverEnergy(
  energy: number,
  supplyEff: number,
  delay: number,
): number {
  return energy / supplyEff + delay;
}

function getUnitRangesData(units: LegacyPart[], fcs: LegacyPart): unknown[] {
  const res = units.map(
    (unit) => unit.IdealRange || unit.EffectiveRange || null,
  );
  return res.concat([
    fcs.CloseRangeAssist,
    fcs.MediumRangeAssist,
    fcs.LongRangeAssist,
  ]);
}

function getKickDamage(legType: string, weight: number): number {
  const baseDmg = legType === "Reverse-Joint" ? 420 : 350;
  const mult = piecewiseLinear(weight / 10000, [
    [5, 1],
    [6, 1.1],
    [7, 1.3],
    [8, 1.6],
    [13, 2],
  ]);
  return baseDmg * mult;
}

const legTypeImpact: Record<string, [number, number]> = {
  Bipedal: [480, 210],
  "Reverse-Joint": [700, 320],
  Tetrapod: [360, 160],
  Tank: [590, 270],
};

const unitSlots = ["rightArm", "leftArm", "rightBack", "leftBack"] as const;
const frameSlots = ["head", "core", "arms", "legs"] as const;
const innerSlots = ["booster", "fcs", "generator", "expansion"] as const;
const allSlots = [...unitSlots, ...frameSlots, ...innerSlots];

export type AcPartsMap = Record<string, LegacyPart>;

/**
 * Full AC stat groups matching the reference UI ordering.
 */
export function computeAllStats(parts: AcPartsMap): LegacyStatGroup[] {
  const merged: AcPartsMap = {
    ...parts,
    expansion: parts.expansion ?? LEGACY_NONE_EXPANSION,
  };
  const { core, arms, legs, booster, fcs, generator } = merged;
  const units = unitSlots.map((s) => merged[s]!);

  const weightPerGroup = [unitSlots, frameSlots, innerSlots].map((slots) =>
    sumKeyOver(merged, "Weight", [...slots]),
  );
  const enLoadInner = [...innerSlots].filter((s) => s !== "generator");
  const enLoadPerGroup = [
    [...unitSlots],
    [...frameSlots],
    enLoadInner,
  ].map((slots) => sumKeyOver(merged, "ENLoad", slots));
  const weight = total(weightPerGroup);

  const ap = sumKeyOver(merged, "AP", [...frameSlots]);
  const defense = {
    kinetic: sumKeyOver(merged, "AntiKineticDefense", [...frameSlots]),
    energy: sumKeyOver(merged, "AntiEnergyDefense", [...frameSlots]),
    explosive: sumKeyOver(merged, "AntiExplosiveDefense", [...frameSlots]),
  };
  const effectiveAP = {
    kinetic: (ap * defense.kinetic) / 1000,
    energy: (ap * defense.energy) / 1000,
    explosive: (ap * defense.explosive) / 1000,
  };

  let baseBoostSpeed: number;
  let boosterSrcPart: LegacyPart;
  if (legs.LegType === "Tank") {
    baseBoostSpeed = legs.HighSpeedPerf as number;
    boosterSrcPart = legs;
  } else {
    baseBoostSpeed = ((booster.Thrust as number) * 6) / 100;
    boosterSrcPart = booster;
  }

  const baseSpeedValues: Record<string, number> = {
    boostAerial: (booster.Thrust as number) * 0.06,
    quickBoost: (boosterSrcPart.QBThrust as number) / 50,
    upwards: (boosterSrcPart.UpwardThrust as number) * 0.06,
    assaultBoost: (boosterSrcPart.ABThrust as number) * 0.06,
    meleeBoost: (boosterSrcPart.MeleeAttackThrust as number) * 0.06,
    hover: legs.BaseHoverSpeed ? (legs.BaseHoverSpeed as number) : 0,
    hoverQuickBoost: legs.BaseHoverQBSpeed
      ? (legs.BaseHoverQBSpeed as number)
      : 0,
  };

  let boostSpeedKey: string;
  if (legs.Name === "EL-TL-11 FORTALEZA") boostSpeedKey = "boostGroundedFortaleza";
  else if (
    ["VE-42B", "LG-022T BORNEMISSZA"].includes(legs.Name as string)
  )
    boostSpeedKey = "boostGroundedTank";
  else boostSpeedKey = "boostGrounded";
  baseSpeedValues[boostSpeedKey] = baseBoostSpeed;

  const loadRatio = (weight - (legs.Weight as number)) / (legs.LoadLimit as number);
  const speedValues: Record<string, number> = {};
  for (const key of Object.keys(baseSpeedValues)) {
    const [bpMult, bpOver] = speedBreakpoints[key]!;
    speedValues[key] = getSpeedSpec(
      baseSpeedValues[key]!,
      weight,
      loadRatio,
      bpMult,
      bpOver,
    );
  }

  const [baseQBReloadTime, baseQBIdealWeight, baseQBENConsumption, qbJetDuration] =
    ["QBReloadTime", "QBReloadIdealWeight", "QBENConsumption", "QBJetDuration"].map(
      (name) => boosterSrcPart[name] as number,
    );

  const qbReloadTime = getQBReloadTime(
    baseQBReloadTime,
    baseQBIdealWeight,
    weight,
  );
  const qbENConsumption =
    baseQBENConsumption * (2 - (core.BoosterEfficiencyAdj as number) / 100);

  const enCapacity = generator.ENCapacity as number;
  const enOutput = Math.floor(
    (generator.ENOutput as number) * 0.01 * (core.GeneratorOutputAdj as number),
  );
  const enLoad = total(enLoadPerGroup);
  const enSupplyEfficiency = getENSupplyEfficiency(enOutput, enLoad);
  const enRechargeDelay = getRechargeDelays(generator, core);
  const postRecENSupply = generator.PostRecoveryENSupply as number;

  const fullRechargeTime = timeToRecoverEnergy(
    enCapacity,
    enSupplyEfficiency,
    enRechargeDelay.normal,
  );
  const fullRechargeTimeRedline = timeToRecoverEnergy(
    enCapacity - postRecENSupply,
    enSupplyEfficiency,
    enRechargeDelay.redline,
  );
  const qbENRechargeTime =
    qbJetDuration +
    timeToRecoverEnergy(
      qbENConsumption,
      enSupplyEfficiency,
      enRechargeDelay.normal,
    );

  const armsLoad = sumKeyOver(merged, "Weight", ["rightArm", "leftArm"]);
  const legsLoad = sumKeyOver(
    merged,
    "Weight",
    [...allSlots].filter((s) => s !== "legs"),
  );

  const recoilUnits = units.filter(
    (u) =>
      finiteNumber(u.Recoil, 0) > 0 &&
      finiteNumber(u.RapidFire, 0) > 0 &&
      !recoilExcludedUnits.includes(u.Name as string),
  );
  const [avgRecoil, recoilPlotPoints] = recoilSimulation(
    recoilUnits,
    arms.RecoilControl as number,
  );

  const kickDamage = getKickDamage(legs.LegType as string, weight);
  const [kickImpact, kickAccImpact] =
    legTypeImpact[legs.LegType as string] ?? [0, 0];

  return [
    [
      { name: "AP", value: ap },
      { name: "AntiKineticDefense", value: defense.kinetic },
      { name: "AntiEnergyDefense", value: defense.energy },
      { name: "AntiExplosiveDefense", value: defense.explosive },
      {
        name: "AttitudeStability",
        value: sumKeyOver(merged, "AttitudeStability", [
          "head",
          "core",
          "legs",
        ]),
      },
      { name: "AttitudeRecovery", value: getAttitudeRecovery(weight) },
      { name: "EffectiveAPKinetic", value: effectiveAP.kinetic },
      { name: "EffectiveAPEnergy", value: effectiveAP.energy },
      { name: "EffectiveAPExplosive", value: effectiveAP.explosive },
      {
        name: "EffectiveAPAvg",
        value: mean(Object.values(effectiveAP)) ?? 0,
      },
    ],
    [
      {
        name: "TargetTracking",
        value: getTargetTracking(
          arms.FirearmSpecialization as number,
          armsLoad / (arms.ArmsLoadLimit as number),
        ),
      },
      {
        name: "AimAssistGraph",
        value: getUnitRangesData(units, fcs),
        type: "RangePlot",
      },
      { name: "KickDamage", value: kickDamage },
      { name: "KickImpact", value: kickImpact },
      { name: "KickAccumulativeImpact", value: kickAccImpact },
      { name: "KickDirectDamage", value: kickDamage * 2.8 },
      {
        name: "RecoilAccumulationGraph",
        value: recoilPlotPoints,
        type: "RecoilPlot",
      },
      { name: "AverageRecoil", value: avgRecoil },
    ],
    [
      { name: "GroundedBoostSpeed", value: speedValues[boostSpeedKey]! },
      { name: "AerialBoostSpeed", value: speedValues.boostAerial! },
      { name: "QBSpeed", value: speedValues.quickBoost! },
      { name: "QBENConsumption", value: qbENConsumption },
      { name: "QBReloadTime", value: qbReloadTime },
      {
        name: "MaxConsecutiveQB",
        value: Math.ceil(enCapacity / qbENConsumption),
      },
      { name: "UpwardSpeed", value: speedValues.upwards! },
      {
        name: "UpwardEconomy",
        value:
          (3.6 * (boosterSrcPart.UpwardENConsumption as number)) /
          speedValues.upwards!,
      },
      { name: "AssaultBoostSpeed", value: speedValues.assaultBoost! },
      {
        name: "AssaultBoostEconomy",
        value:
          (3.6 * (boosterSrcPart.ABENConsumption as number)) /
          speedValues.assaultBoost!,
      },
      { name: "MeleeBoostSpeed", value: speedValues.meleeBoost! },
      { name: "HoverSpeed", value: speedValues.hover! },
      { name: "HoverQBSpeed", value: speedValues.hoverQuickBoost! },
    ],
    [
      { name: "ENCapacity", value: enCapacity },
      { name: "ENSupplyEfficiency", value: enSupplyEfficiency },
      { name: "ENRechargeDelay", value: enRechargeDelay.normal },
      { name: "ENRechargeDelayRedline", value: enRechargeDelay.redline },
      { name: "QBENRechargeTime", value: qbENRechargeTime },
      { name: "FullRechargeTime", value: fullRechargeTime },
      { name: "FullRechargeTimeRedline", value: fullRechargeTimeRedline },
      {
        name: "ENRecoveryGraph",
        value: {
          normal: [
            enRechargeDelay.normal,
            0,
            enSupplyEfficiency,
            enCapacity,
          ],
          redline: [
            enRechargeDelay.redline,
            postRecENSupply,
            enSupplyEfficiency,
            enCapacity,
          ],
        },
        type: "EnergyPlot",
      },
    ],
    [
      { name: "TotalWeight", value: weight },
      { name: "TotalArmsLoad", value: armsLoad },
      { name: "ArmsLoadLimit", value: arms.ArmsLoadLimit as number },
      { name: "TotalLoad", value: legsLoad },
      { name: "LoadLimit", value: legs.LoadLimit as number },
      { name: "TotalENLoad", value: enLoad },
      { name: "ENOutput", value: enOutput },
    ],
  ];
}

export function findLegacyStat(
  groups: LegacyStatGroup[],
  name: string,
): unknown {
  for (const g of groups) {
    const row = g.find((s) => s.name === name);
    if (row) return row.value;
  }
  return undefined;
}
