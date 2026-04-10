import type { BuildAnalysis } from "@/lib/calc";
import { findLegacyStat } from "@/lib/calc/compute-all-stats";
import type { LegacyStatGroup } from "@/lib/calc/types";

import {
  DEFAULT_SIM_TUNING,
  type SimulationTuning,
  tuningFor,
} from "./simulation-tuning";
import type {
  CreateWeaponsTestOptions,
  WeaponLoadoutEntry,
  WeaponsTestSimulationState,
  WeaponsTestTickInput,
  WeaponTestEvent,
} from "./types";

function num(groups: readonly LegacyStatGroup[], name: string): number {
  const v = findLegacyStat(groups as LegacyStatGroup[], name);
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function emptyCooldowns(loadout: WeaponLoadoutEntry[]): Record<string, number> {
  return Object.fromEntries(loadout.map((w) => [w.id, 0]));
}

export function createInitialWeaponsTestState(
  attackerAnalysis: BuildAnalysis,
  loadout: WeaponLoadoutEntry[],
  options: CreateWeaponsTestOptions,
): WeaponsTestSimulationState {
  const maxEnergy = Math.max(1000, num(attackerAnalysis.groups, "ENCapacity"));
  const staggerMax =
    options.targetMode === "compare" && options.targetAnalysis
      ? Math.max(520, options.targetAnalysis.totalStability * 12)
      : Math.max(450, attackerAnalysis.totalStability * 10);

  return {
    time: 0,
    currentEnergy: maxEnergy,
    maxEnergy,
    targetStagger: 0,
    targetStaggerMax: staggerMax,
    targetMode: options.targetMode,
    activeWeaponId:
      options.primaryWeaponId ??
      (loadout.length ? loadout[0]!.id : null),
    weaponCooldowns: emptyCooldowns(loadout),
    events: [],
    pendingImpacts: [],
  };
}

const ORIGIN = { x: -2, y: 1.2, z: 0 };
const TARGET = { x: 1.5, y: 1, z: 0 };
const TRAVEL = 0.14;
/** Base stagger decay per second; scaled by fill level (polish). */
const STAGGER_DECAY_BASE = 82;
const EN_RECHARGE_MUL = 0.85;

function fireCandidates(
  loadout: WeaponLoadoutEntry[],
  input: WeaponsTestTickInput,
): WeaponLoadoutEntry[] {
  if (input.multiWeapon) {
    const armed = input.armedWeaponIds;
    if (!armed || armed.size === 0) return [];
    return loadout.filter((w) => armed.has(w.id));
  }
  const one = loadout.find((w) => w.id === input.activeWeaponId);
  return one ? [one] : [];
}

export function tickWeaponsTest(
  state: WeaponsTestSimulationState,
  dt: number,
  attackerAnalysis: BuildAnalysis,
  loadout: WeaponLoadoutEntry[],
  input: WeaponsTestTickInput,
  tuning: SimulationTuning = DEFAULT_SIM_TUNING,
): WeaponsTestSimulationState {
  const fullRechargeT = Math.max(
    2,
    num(attackerAnalysis.groups, "FullRechargeTime") || 8,
  );
  const rechargePerS =
    (state.maxEnergy / fullRechargeT) * EN_RECHARGE_MUL;

  const time = state.time + dt;

  const nextCd: Record<string, number> = { ...state.weaponCooldowns };
  for (const w of loadout) {
    nextCd[w.id] = Math.max(0, (nextCd[w.id] ?? 0) - dt);
  }

  let currentEnergy = Math.min(
    state.maxEnergy,
    state.currentEnergy + rechargePerS * dt,
  );

  const fill =
    state.targetStaggerMax > 0
      ? Math.min(1, state.targetStagger / state.targetStaggerMax)
      : 0;
  const decayScale = 0.64 + fill * 0.78;
  let targetStagger = Math.max(
    0,
    state.targetStagger - STAGGER_DECAY_BASE * decayScale * dt,
  );

  const events: WeaponTestEvent[] = [];
  const pendingImpacts = [...state.pendingImpacts];

  const wantsFire = input.fireHeld || input.autoFire;

  if (wantsFire && loadout.length > 0) {
    const candidates = fireCandidates(loadout, input);
    let salvoIndex = 0;
    for (const weapon of candidates) {
      if ((nextCd[weapon.id] ?? 0) > 0) continue;
      const tun = tuningFor(tuning, weapon.family);
      const cost = Math.max(15, weapon.enCost * tun.enMul);
      const cd = Math.max(0.04, weapon.cooldown * tun.cooldownMul);
      const impact = Math.max(1, weapon.impactPerTrigger * tun.impactMul);
      if (currentEnergy < cost) continue;

      currentEnergy -= cost;
      nextCd[weapon.id] = cd;

      events.push({
        type: "weapon_fired",
        weaponId: weapon.id,
        family: weapon.family,
        origin: { ...ORIGIN },
        t: time,
      });
      events.push({
        type: "energy_spent",
        amount: cost,
        t: time,
      });
      events.push({
        type: "reload_started",
        weaponId: weapon.id,
        t: time,
      });
      pendingImpacts.push({
        t: time + TRAVEL + salvoIndex * 0.018,
        weaponId: weapon.id,
        family: weapon.family,
        impact,
      });
      salvoIndex += 1;
    }
  }

  const stillPending: typeof pendingImpacts = [];
  for (const p of pendingImpacts) {
    if (p.t <= time) {
      targetStagger = Math.min(
        state.targetStaggerMax,
        targetStagger + p.impact,
      );
      events.push({
        type: "projectile_impact",
        weaponId: p.weaponId,
        family: p.family,
        target: { ...TARGET },
        t: p.t,
        impact: p.impact,
      });
      events.push({
        type: "stagger_added",
        amount: p.impact,
        total: targetStagger,
        t: p.t,
      });
      if (targetStagger >= state.targetStaggerMax * 0.92) {
        events.push({ type: "stagger_triggered", t: p.t });
        targetStagger = state.targetStaggerMax * 0.12;
      }
    } else {
      stillPending.push(p);
    }
  }

  const primary =
    loadout.find((w) => w.id === input.activeWeaponId) ?? loadout[0] ?? null;

  return {
    ...state,
    time,
    currentEnergy,
    targetStagger,
    targetStaggerMax: state.targetStaggerMax,
    weaponCooldowns: nextCd,
    events,
    pendingImpacts: stillPending,
    activeWeaponId: primary?.id ?? state.activeWeaponId,
    targetMode: state.targetMode,
  };
}

export function mergeEvents(
  prev: WeaponTestEvent[],
  incoming: WeaponTestEvent[],
  maxTotal = 160,
): WeaponTestEvent[] {
  const next = [...prev, ...incoming];
  return next.length > maxTotal ? next.slice(-maxTotal) : next;
}
