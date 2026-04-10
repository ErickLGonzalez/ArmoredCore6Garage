"use client";

import { useMemo } from "react";
import type { BuildAnalysis } from "@/lib/calc";

type Props = {
  analysisA: BuildAnalysis | null;
  analysisB: BuildAnalysis | null;
};

function fmt(n: number) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function CounterStaggerBreakpointsPanel({ analysisA, analysisB }: Props) {
  const data = useMemo(() => {
    if (!analysisA || !analysisB) return null;
    const aNeedIps = analysisB.totalStability / 4;
    const bNeedIps = analysisA.totalStability / 4;
    const aBreakSec =
      analysisA.impactPerSecond > 0
        ? analysisB.totalStability / analysisA.impactPerSecond
        : Number.POSITIVE_INFINITY;
    const bBreakSec =
      analysisB.impactPerSecond > 0
        ? analysisA.totalStability / analysisB.impactPerSecond
        : Number.POSITIVE_INFINITY;
    return { aNeedIps, bNeedIps, aBreakSec, bBreakSec };
  }, [analysisA, analysisB]);

  return (
    <div className="ac6-block space-y-2 p-2">
      <h3 className="ac6-block-title">
        COUNTERS · STAGGER BREAKPOINTS
      </h3>
      {!data ? (
        <p className="text-[10px] uppercase tracking-[0.05em] text-cyan-200/75">
          ENABLE COMPARE AND KEEP BOTH AC SETS VALID.
        </p>
      ) : (
        <div className="grid gap-1.5 text-[11px] text-cyan-100/90 sm:grid-cols-2">
          <div className="ac6-inner-frame">
            <p className="ac6-system-card-title">A PRESSURE ON B</p>
            <p className="font-mono">NEED IPS (4S): {fmt(data.aNeedIps)}</p>
            <p className="font-mono">PREDICTED BREAK: {fmt(data.aBreakSec)} S</p>
          </div>
          <div className="ac6-inner-frame">
            <p className="ac6-system-card-title">B PRESSURE ON A</p>
            <p className="font-mono">NEED IPS (4S): {fmt(data.bNeedIps)}</p>
            <p className="font-mono">PREDICTED BREAK: {fmt(data.bBreakSec)} S</p>
          </div>
        </div>
      )}
    </div>
  );
}
