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
    <div className="ac6-block space-y-2 p-2">
      <h3 className="ac6-block-title">
        COUNTERS · MATCHUP TTK
      </h3>
      <label className="block text-[11px]">
        <span className="ac6-chart-section-title mb-1 block">
          DAMAGE MITIGATION ({damageMitigationPct}%)
        </span>
        <input
          type="range"
          min={0}
          max={90}
          value={damageMitigationPct}
          onChange={(e) => setDamageMitigationPct(Number(e.target.value))}
          className="w-full accent-cyan-300"
        />
      </label>
      {!rows ? (
        <p className="ac6-chart-hint uppercase tracking-[0.05em]">
          ENABLE COMPARE AND KEEP BOTH AC SETS VALID.
        </p>
      ) : (
        <div className="grid gap-1.5 text-[11px] text-cyan-100/90 sm:grid-cols-2">
          <div className="ac6-inner-frame">
            <p className="ac6-system-card-title">A → B</p>
            <p className="font-mono">EFFECTIVE DPS: {fmt(rows.aDpsEff)}</p>
            <p className="font-mono">TTK: {fmt(rows.aToB)} S</p>
          </div>
          <div className="ac6-inner-frame">
            <p className="ac6-system-card-title">B → A</p>
            <p className="font-mono">EFFECTIVE DPS: {fmt(rows.bDpsEff)}</p>
            <p className="font-mono">TTK: {fmt(rows.bToA)} S</p>
          </div>
        </div>
      )}
    </div>
  );
}
