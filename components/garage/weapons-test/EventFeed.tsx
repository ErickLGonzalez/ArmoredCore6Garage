"use client";

import { useMemo, useState } from "react";

import type { WeaponTestEvent } from "@/lib/garage/weapons-test/types";

function formatEvent(e: WeaponTestEvent): string {
  switch (e.type) {
    case "weapon_fired":
      return `[${e.t.toFixed(2)}s] Fired ${e.weaponId} (${e.family})`;
    case "projectile_impact":
      return `[${e.t.toFixed(2)}s] Impact +${e.impact.toFixed(0)} stagger`;
    case "energy_spent":
      return `[${e.t.toFixed(2)}s] EN −${Math.round(e.amount)}`;
    case "stagger_added":
      return `[${e.t.toFixed(2)}s] Stagger → ${e.total.toFixed(0)}`;
    case "stagger_triggered":
      return `[${e.t.toFixed(2)}s] Stagger triggered (reset)`;
    case "reload_started":
      return `[${e.t.toFixed(2)}s] Reload ${e.weaponId}`;
    default:
      return "";
  }
}

type Filter = "all" | "combat" | "econ";

function passesFilter(e: WeaponTestEvent, f: Filter): boolean {
  if (f === "all") return true;
  if (f === "combat") {
    return (
      e.type === "weapon_fired" ||
      e.type === "projectile_impact" ||
      e.type === "stagger_added" ||
      e.type === "stagger_triggered" ||
      e.type === "reload_started"
    );
  }
  return e.type === "energy_spent";
}

type Props = { events: WeaponTestEvent[] };

const tabCls = (on: boolean) =>
  `classic-tab text-[9px] focus-visible:outline-none ${on ? "classic-tab-active" : ""}`;

export function EventFeed({ events }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const lines = useMemo(() => {
    return events
      .filter((e) => passesFilter(e, filter))
      .slice(-24)
      .reverse()
      .map(formatEvent)
      .filter(Boolean);
  }, [events, filter]);

  return (
    <div className="ac6-inner-frame px-2 py-1.5 font-mono text-[10px] leading-relaxed text-cyan-100/80">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-cyan-200/60">
          Combat log
        </p>
        <div className="flex flex-wrap gap-0.5">
          {(["all", "combat", "econ"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={tabCls(filter === f)}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-40 overflow-y-auto pr-1">
        {lines.length === 0 ? (
          <span className="text-cyan-200/40">No lines for this filter…</span>
        ) : (
          <ul className="space-y-0.5">
            {lines.map((t, i) => (
              <li key={`${i}-${t.slice(0, 16)}`}>{t}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
