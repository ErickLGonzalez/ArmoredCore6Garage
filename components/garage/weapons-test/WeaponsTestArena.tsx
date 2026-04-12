"use client";

import type { BuildAnalysis } from "@/lib/calc";
import type { WeaponTestEvent } from "@/lib/garage/weapons-test/types";

import { CompareAcRig } from "./CompareAcRig";
import { DummyAcRig } from "./DummyAcRig";
import { ParticleScene } from "./effects/ParticleScene";

type Props = {
  targetMode: "dummy" | "compare";
  compareAnalysis: BuildAnalysis | null;
  events: WeaponTestEvent[];
  quality: "off" | "low" | "high";
  hitFlash: boolean;
  hitPulse: number;
  lastImpactDamage: number | null;
  visualTimeScale: number;
  particleSceneKey: string;
};

export function WeaponsTestArena({
  targetMode,
  compareAnalysis,
  events,
  quality,
  hitFlash,
  hitPulse,
  lastImpactDamage,
  visualTimeScale,
  particleSceneKey,
}: Props) {
  return (
    <div className="relative grid min-h-[160px] grid-cols-1 gap-2 md:grid-cols-2">
      <div className="relative">
        <div className="ac6-chart-hint absolute left-2 top-2 z-10 font-semibold uppercase tracking-[0.14em]">
          Attacker
        </div>
        <div
          className="relative flex min-h-[140px] items-center justify-center border-2 border-[var(--ui-border)]"
          style={{
            background: "color-mix(in srgb, var(--ui-panel-bottom) 90%, black)",
          }}
        >
          <ParticleScene
            key={particleSceneKey}
            events={events}
            quality={quality}
            visualTimeScale={visualTimeScale}
          />
          <span className="ac6-chart-hint relative z-[1] text-[11px]">
            Muzzle / tracers (particles)
          </span>
        </div>
      </div>
      <div className="relative">
        {targetMode === "compare" && compareAnalysis ? (
          <CompareAcRig
            analysis={compareAnalysis}
            hitFlash={hitFlash}
            hitPulse={hitPulse}
            lastImpactDamage={lastImpactDamage}
          />
        ) : (
          <DummyAcRig
            hitFlash={hitFlash}
            hitPulse={hitPulse}
            lastImpactDamage={lastImpactDamage}
          />
        )}
      </div>
    </div>
  );
}
