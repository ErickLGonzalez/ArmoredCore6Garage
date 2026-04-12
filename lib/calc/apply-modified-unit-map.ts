/**
 * Classic garage "modified unit specs": rescale unit base attack stats from
 * arms {@link MeleeSpecialization} and generator {@link EnergyFirearmSpec},
 * then re-run {@link addAdvancedUnitStats} so derived DPS / IPS match.
 *
 * Ratios follow the common AC6 reference shape (neutral at 100): mult = spec / 100.
 * Energy firearms also shorten {@link FullChgTime} by 100 / EnergyFirearmSpec.
 */
import type { AcPartsMap } from "./compute-all-stats";
import { addAdvancedUnitStats } from "./postprocess/advanced-unit-stats";
import type { LegacyPart } from "./types";

const UNIT_SLOTS = ["rightArm", "leftArm", "rightBack", "leftBack"] as const;

const ATTACK_SCALE_KEYS = [
  "AttackPower",
  "Impact",
  "AccumulativeImpact",
  "ChgAttackPower",
  "ChgImpact",
  "ChgAccumImpact",
  "FullChgAttackPower",
  "FullChgImpact",
  "FullChgAccumImpact",
] as const;

function positiveSpec100(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return raw / 100;
  }
  return 1;
}

function scaleNumOrTuple(v: unknown, m: number): unknown {
  if (m === 1 || !Number.isFinite(m)) return v;
  if (typeof v === "number" && Number.isFinite(v)) return v * m;
  if (Array.isArray(v) && v.length >= 1 && typeof v[0] === "number") {
    const head = v[0] * m;
    return [head, ...v.slice(1)];
  }
  return v;
}

function scaleAttackKeys(unit: LegacyPart, mult: number): LegacyPart {
  if (mult === 1 || !Number.isFinite(mult)) return unit;
  const out: LegacyPart = { ...unit };
  for (const key of ATTACK_SCALE_KEYS) {
    if (!(key in out)) continue;
    out[key] = scaleNumOrTuple(out[key], mult);
  }
  return out;
}

/** Shorter charge at higher Energy Firearm Spec (inverse of spec/100). */
function scaleEnergyChargeTime(unit: LegacyPart, energySpecRaw: unknown): LegacyPart {
  const spec =
    typeof energySpecRaw === "number" &&
    Number.isFinite(energySpecRaw) &&
    energySpecRaw > 0
      ? energySpecRaw
      : 100;
  const timeMult = 100 / spec;
  if (timeMult === 1 || !Number.isFinite(timeMult)) return unit;
  const out: LegacyPart = { ...unit };
  if (typeof out.FullChgTime === "number" && Number.isFinite(out.FullChgTime)) {
    out.FullChgTime = out.FullChgTime * timeMult;
  }
  return out;
}

function modifyOneUnit(
  unit: LegacyPart,
  arms: LegacyPart,
  generator: LegacyPart,
): LegacyPart {
  const meleeMult = unit.IsMeleeSpec === true ? positiveSpec100(arms.MeleeSpecialization) : 1;
  const energyMult =
    unit.IsEnergyFirearmSpec === true ? positiveSpec100(generator.EnergyFirearmSpec) : 1;
  const dmgMult = meleeMult * energyMult;

  let next = unit;
  if (dmgMult !== 1) next = scaleAttackKeys(next, dmgMult);
  if (unit.IsEnergyFirearmSpec === true) {
    next = scaleEnergyChargeTime(next, generator.EnergyFirearmSpec);
  }
  return addAdvancedUnitStats(next);
}

/**
 * Returns a new {@link AcPartsMap} with unit slots replaced by cross-part-adjusted copies.
 */
export function applyModifiedUnitsToLegacyMap(parts: AcPartsMap): AcPartsMap {
  const arms = parts.arms;
  const generator = parts.generator;
  const out: AcPartsMap = { ...parts };
  for (const slot of UNIT_SLOTS) {
    const u = parts[slot];
    if (u == null) continue;
    if (u.Kind !== "Unit") continue;
    out[slot] = modifyOneUnit({ ...u }, arms, generator);
  }
  return out;
}
