import type { WeaponTestEvent } from "./types";

export function eventTime(e: WeaponTestEvent): number {
  return "t" in e ? e.t : 0;
}

export function sortEventsByTime(events: WeaponTestEvent[]): WeaponTestEvent[] {
  return [...events].sort((a, b) => eventTime(a) - eventTime(b));
}

export function clipTimeBounds(events: WeaponTestEvent[]): {
  t0: number;
  span: number;
} {
  if (!events.length) return { t0: 0, span: 0 };
  const ts = events.map(eventTime);
  const t0 = Math.min(...ts);
  const t1 = Math.max(...ts);
  return { t0, span: Math.max(0, t1 - t0) };
}
