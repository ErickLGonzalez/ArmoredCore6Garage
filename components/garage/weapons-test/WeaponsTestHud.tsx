"use client";

import { EnergyBar } from "./EnergyBar";
import { StaggerBar } from "./StaggerBar";

type Props = {
  currentEnergy: number;
  maxEnergy: number;
  targetStagger: number;
  targetStaggerMax: number;
  timeSec: number;
  /** Shortest cooldown among weapons that are eligible to fire this tick. */
  cooldownSec: number;
  targetLabel?: string;
};

export function WeaponsTestHud({
  currentEnergy,
  maxEnergy,
  targetStagger,
  targetStaggerMax,
  timeSec,
  cooldownSec,
  targetLabel,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-[10px] text-cyan-200/65">
        <span className="font-semibold uppercase tracking-wide">
          Simulation
        </span>
        <span className="font-mono text-cyan-100/85">
          t = {timeSec.toFixed(2)}s
          {cooldownSec > 0.01
            ? ` · next CD ${cooldownSec.toFixed(2)}s`
            : " · ready"}
        </span>
      </div>
      {targetLabel ? (
        <p className="text-[9px] uppercase tracking-wide text-cyan-200/50">
          {targetLabel}
        </p>
      ) : null}
      <EnergyBar
        current={currentEnergy}
        max={maxEnergy}
      />
      <StaggerBar
        current={targetStagger}
        max={targetStaggerMax}
      />
    </div>
  );
}
