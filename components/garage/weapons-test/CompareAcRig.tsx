"use client";

import type { BuildAnalysis } from "@/lib/calc";

type Props = {
  analysis: BuildAnalysis;
  hitFlash: boolean;
  hitPulse: number;
  lastImpactDamage: number | null;
};

export function CompareAcRig({
  analysis,
  hitFlash,
  hitPulse,
  lastImpactDamage,
}: Props) {
  return (
    <div
      className={`relative flex h-full min-h-[140px] flex-col overflow-hidden rounded border border-amber-700/40 bg-gradient-to-b from-amber-950/25 to-zinc-950/80 p-2 ${
        hitFlash ? "ring-2 ring-amber-400/70" : ""
      }`}
    >
      <p className="relative z-[2] text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-200/70">
        AC SET B (compare target)
      </p>
      {lastImpactDamage != null && hitPulse > 0 ? (
        <span
          key={hitPulse}
          className="pointer-events-none absolute left-1/2 top-[40%] z-[3] font-mono text-sm font-bold tabular-nums text-amber-300 ac6-impact-float"
        >
          +{Math.round(lastImpactDamage)}
        </span>
      ) : null}
      <div
        key={hitPulse}
        className={
          hitPulse > 0
            ? "ac6-target-shake mt-2 flex flex-1 flex-col"
            : "mt-2 flex flex-1 flex-col"
        }
      >
        <dl className="grid grid-cols-2 gap-1 text-[10px] text-amber-100/85">
          <div>
            <dt className="text-amber-200/55">AP</dt>
            <dd className="font-mono">{Math.round(analysis.totalAp)}</dd>
          </div>
          <div>
            <dt className="text-amber-200/55">Stability</dt>
            <dd className="font-mono">{Math.round(analysis.totalStability)}</dd>
          </div>
          <div>
            <dt className="text-amber-200/55">Stagger cap</dt>
            <dd className="font-mono">
              ~{Math.round(Math.max(520, analysis.totalStability * 12))}
            </dd>
          </div>
          <div>
            <dt className="text-amber-200/55">Mean DEF</dt>
            <dd className="font-mono">{analysis.totalDef.toFixed(0)}</dd>
          </div>
        </dl>
        <p className="mt-auto pt-2 text-[9px] leading-snug text-amber-200/45">
          Stagger bar uses this build&apos;s stability-derived cap. No return fire
          in this slice.
        </p>
      </div>
    </div>
  );
}
