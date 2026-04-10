"use client";

import { useMemo, useState } from "react";
import type { BuildAnalysis } from "@/lib/calc";

type Props = {
  analysisA: BuildAnalysis | null;
  analysisB: BuildAnalysis | null;
};

function ttkSeconds(ap: number, dps: number) {
  if (!Number.isFinite(ap) || !Number.isFinite(dps) || dps <= 0) return Number.POSITIVE_INFINITY;
  return ap / dps;
}

function fmt(n: number) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function CounterMatchupTTKPanel({ analysisA, analysisB }: Props) {
  const [damageMitigationPct, setDamageMitigationPct] = useState(0);

  const rows = useMemo(() => {
    if (!analysisA || !analysisB) return null;
    const mit = Math.max(0, Math.min(90, damageMitigationPct)) / 100;
    const aDpsEff = analysisA.dps * (1 - mit);
    const bDpsEff = analysisB.dps * (1 - mit);
    return {
      aToB: ttkSeconds(analysisB.totalAp, aDpsEff),
      bToA: ttkSeconds(analysisA.totalAp, bDpsEff),
      aDpsEff,
      bDpsEff,
    };
  }, [analysisA, analysisB, damageMitigationPct]);

  return (
    <div className="space-y-3 rounded border border-cyan-300/35 bg-cyan-950/20 p-3">
      <h3 className="text-sm font-semibold tracking-wide text-cyan-100">
        COUNTERS · MATCHUP TTK
      </h3>
      <label className="block text-xs text-cyan-200/80">
        Damage mitigation ({damageMitigationPct}%)
        <input
          type="range"
          min={0}
          max={90}
          value={damageMitigationPct}
          onChange={(e) => setDamageMitigationPct(Number(e.target.value))}
          className="mt-1 w-full accent-cyan-300"
        />
      </label>
      {!rows ? (
        <p className="text-xs text-cyan-200/75">Enable compare and keep both builds valid to preview matchup TTK.</p>
      ) : (
        <div className="grid gap-2 text-xs text-cyan-100/90 sm:grid-cols-2">
          <div className="rounded border border-cyan-300/20 bg-[#0f2132] p-2">
            <p className="font-semibold">A → B</p>
            <p className="font-mono">effective DPS: {fmt(rows.aDpsEff)}</p>
            <p className="font-mono">TTK: {fmt(rows.aToB)} s</p>
          </div>
          <div className="rounded border border-cyan-300/20 bg-[#0f2132] p-2">
            <p className="font-semibold">B → A</p>
            <p className="font-mono">effective DPS: {fmt(rows.bDpsEff)}</p>
            <p className="font-mono">TTK: {fmt(rows.bToA)} s</p>
          </div>
        </div>
      )}
    </div>
  );
}
