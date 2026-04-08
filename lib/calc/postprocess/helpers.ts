import type { LegacyPart } from "../types";

export function valueOrNaN(val: unknown): number {
  if (val === null || val === undefined) return NaN;
  if (typeof val === "number") return val;
  return NaN;
}

export function resolveList(spec: unknown): number {
  if (Number.isNaN(spec as number)) return NaN;
  if (Array.isArray(spec) && spec.length >= 2) {
    const a = spec[0];
    const b = spec[1];
    if (typeof a === "number" && typeof b === "number") return a * b;
  }
  return typeof spec === "number" ? spec : NaN;
}

export function addIfValid(
  obj: LegacyPart,
  key: string,
  val: unknown,
): unknown {
  const ok =
    (typeof val === "number" && !Number.isNaN(val)) ||
    (Array.isArray(val) &&
      val.length > 0 &&
      typeof val[0] === "number" &&
      !Number.isNaN(val[0]));
  if (ok) obj[key] = val;
  return val;
}

export function getDirectAtkPwrStat(
  rawStat: unknown,
  directHitAdj: number,
): number | [number, number] {
  if (Array.isArray(rawStat) && rawStat.length >= 2) {
    const a = rawStat[0];
    const b = rawStat[1];
    if (typeof a === "number" && typeof b === "number") {
      return [(a * directHitAdj) / 100, b];
    }
  }
  if (typeof rawStat === "number") return (rawStat * directHitAdj) / 100;
  return NaN;
}
