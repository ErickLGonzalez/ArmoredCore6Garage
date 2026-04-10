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
        <div className="absolute left-2 top-2 z-10 text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-200/50">
          Attacker
        </div>
        <div className="relative flex min-h-[140px] items-center justify-center rounded border border-cyan-800/35 bg-cyan-950/15">
          <ParticleScene
            key={particleSceneKey}
            events={events}
            quality={quality}
            visualTimeScale={visualTimeScale}
          />
          <span className="relative z-[1] text-[11px] text-cyan-200/45">
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
