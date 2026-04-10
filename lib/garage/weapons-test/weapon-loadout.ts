import { assemblyToLegacyMap } from "@/lib/calc/assembly-map";
import type { BuildAssembly } from "@/lib/calc/types";
import type { WeaponFxFamily, WeaponLoadoutEntry } from "./types";

const WEAPON_SLOTS = [
  "rightArm",
  "leftArm",
  "rightBack",
  "leftBack",
] as const;

function statNum(part: Record<string, unknown>, key: string): number {
  const v = part[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function classifyFamily(name: string, kind: string): WeaponFxFamily {
  const s = `${name} ${kind}`.toLowerCase();
  if (
    /laser|beam|pulse|wave|coral|plasma|needle/.test(s) &&
    !/rifle\s*\(/.test(s)
  ) {
    if (/plasma|needle/.test(s)) return "explosive";
    return "laser";
  }
  if (/grenade|bazooka|rocket|missile|explosive|stun|napalm/.test(s)) {
    return "explosive";
  }
  return "kinetic";
}

/**
 * One firing “trigger” models a short burst: stagger ~ IPS-derived, EN from load.
 */
export function weaponLoadoutFromAssembly(
  assembly: BuildAssembly | null,
): WeaponLoadoutEntry[] {
  if (!assembly) return [];
  const map = assemblyToLegacyMap(assembly);
  const out: WeaponLoadoutEntry[] = [];
  for (const slot of WEAPON_SLOTS) {
    const part = assembly[slot];
    if (!part) continue;
    const legacy = map[slot];
    if (!legacy) continue;
    const ips = statNum(legacy as Record<string, unknown>, "Impact/s");
    const dps = statNum(legacy as Record<string, unknown>, "Damage/s");
    const enLoad = statNum(legacy as Record<string, unknown>, "ENLoad");
    const reload = statNum(legacy as Record<string, unknown>, "ReloadTime");
    const name = part.identity.name;
    const id = `${slot}-${part.identity.id}`;
    const family = classifyFamily(name, part.identity.kind);
    const rof = reload > 0 ? Math.min(2.5, 1 / Math.max(0.15, reload)) : 2;
    const impactPerTrigger = Math.max(8, ips * 0.12 * Math.min(1.2, rof * 0.35));
    const enCost = Math.max(180, enLoad * 4 + dps * 0.06);
    const cooldown = Math.max(0.22, Math.min(1.4, 0.28 + reload * 0.15));
    out.push({
      id,
      slot,
      name,
      family,
      impactPerTrigger,
      enCost,
      cooldown,
    });
  }
  return out;
}
