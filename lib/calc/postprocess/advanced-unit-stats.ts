import type { LegacyPart } from "../types";

import {
  addIfValid,
  getDirectAtkPwrStat,
  resolveList,
  valueOrNaN,
} from "./helpers";
import { normalizeRapidFire } from "./normalize-rapid-fire";

/** Adds MagazineRounds, DPS, MagDumpTime, etc. — port of DataFuncs.addAdvancedUnitStats. */
export function addAdvancedUnitStats(unit: LegacyPart): LegacyPart {
  const res: LegacyPart = { ...unit };

  if (res.Description === "Laser Turret") return res;

  const [
    rawAtkPwr,
    rawImpact,
    rawAccImpact,
    consecutiveHits,
    lockTime,
    lockDelay,
    heatBuildup,
    cooling,
    coolingDelay,
    rawChgAtkPwr,
    rawFullChgAtkPwr,
  ] = [
    "AttackPower",
    "Impact",
    "AccumulativeImpact",
    "ConsecutiveHits",
    "HomingLockTime",
    "HomingLockDelay",
    "ATKHeatBuildup",
    "Cooling",
    "CoolingDelay",
    "ChgAttackPower",
    "FullChgAttackPower",
  ].map((stat) => valueOrNaN(res[stat]));

  let rapidFire = valueOrNaN(res.RapidFire);
  let magSize = valueOrNaN(res.MagazineRounds);
  let reloadTime = valueOrNaN(res.ReloadTime);

  const normRf = normalizeRapidFire(
    String(res.Name),
    rapidFire,
    rawAtkPwr,
    lockDelay,
    lockTime,
  );
  rapidFire = normRf[0];
  const bulletGroupSize = normRf[1];

  if (res.ReloadType === "Single Shot") {
    magSize = bulletGroupSize;
  } else if (res.ReloadType === "Overheat") {
    const heatPerShot =
      heatBuildup -
      Math.max(0, 1 / rapidFire - coolingDelay) * cooling;
    magSize = (Math.ceil(1000 / heatPerShot) - 1) * bulletGroupSize;
    addIfValid(res, "MagazineRounds", magSize);
    reloadTime = coolingDelay + (heatPerShot * magSize) / bulletGroupSize / cooling;
    addIfValid(res, "ReloadTime", reloadTime);
  }

  const atkPwr = resolveList(rawAtkPwr);
  const impact = resolveList(rawImpact);
  const accImpact = resolveList(rawAccImpact);

  const groupMagSize = magSize / bulletGroupSize;
  const magDumpTime = (groupMagSize - 1) / rapidFire;
  if (magDumpTime > 0) addIfValid(res, "MagDumpTime", magDumpTime);

  if (res.Description === "Pulse Shield Launcher") return res;

  const dps = addIfValid(res, "Damage/s", atkPwr * rapidFire);
  addIfValid(res, "Impact/s", impact * rapidFire);
  addIfValid(res, "AccumulativeImpact/s", accImpact * rapidFire);

  let den = reloadTime;
  den = Number.isNaN(magDumpTime) ? den : den + magDumpTime;
  den = Number.isNaN(lockTime) ? den : den + lockTime;
  addIfValid(res, "Damage/sInclReload", (groupMagSize * atkPwr) / den);
  addIfValid(res, "Impact/sInclReload", (groupMagSize * impact) / den);
  addIfValid(res, "AccImpact/sInclReload", (groupMagSize * accImpact) / den);

  const comboDmg = addIfValid(res, "ComboDamage", atkPwr * consecutiveHits);
  addIfValid(res, "ComboImpact", impact * consecutiveHits);
  addIfValid(res, "ComboAccumulativeImpact", accImpact * consecutiveHits);

  const directHitAdj = valueOrNaN(res.DirectHitAdjustment);
  const chgDirectHitAdj =
    valueOrNaN(res.ChgDirectHitAdjustment) || directHitAdj;
  const fullChgDirectHitAdj =
    valueOrNaN(res.FullChgDirectHitAdjustment) || directHitAdj;

  const directAtkStatsData: [string, unknown, number][] = [
    ["DirectAttackPower", rawAtkPwr, directHitAdj],
    ["ChgDirectAttackPower", rawChgAtkPwr, chgDirectHitAdj],
    ["FullChgDirectAttackPower", rawFullChgAtkPwr, fullChgDirectHitAdj],
  ];
  for (const [name, val, adj] of directAtkStatsData) {
    addIfValid(res, name, getDirectAtkPwrStat(val, adj));
  }

  if (typeof dps === "number" && !Number.isNaN(directHitAdj)) {
    addIfValid(res, "DirectDamage/s", dps * (directHitAdj / 100));
  }
  if (typeof comboDmg === "number" && !Number.isNaN(directHitAdj)) {
    addIfValid(res, "ComboDirectDamage", comboDmg * (directHitAdj / 100));
  }

  return res;
}
