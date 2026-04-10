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
    <div className="space-y-3 rounded border border-cyan-300/35 bg-cyan-950/20 p-3">
      <h3 className="text-sm font-semibold tracking-wide text-cyan-100">
        COUNTERS · STAGGER BREAKPOINTS
      </h3>
      {!data ? (
        <p className="text-xs text-cyan-200/75">Enable compare and keep both builds valid to preview stagger breakpoints.</p>
      ) : (
        <div className="grid gap-2 text-xs text-cyan-100/90 sm:grid-cols-2">
          <div className="rounded border border-cyan-300/20 bg-[#0f2132] p-2">
            <p className="font-semibold">A pressure on B</p>
            <p className="font-mono">Need IPS (4s): {fmt(data.aNeedIps)}</p>
            <p className="font-mono">Predicted break: {fmt(data.aBreakSec)} s</p>
          </div>
          <div className="rounded border border-cyan-300/20 bg-[#0f2132] p-2">
            <p className="font-semibold">B pressure on A</p>
            <p className="font-mono">Need IPS (4s): {fmt(data.bNeedIps)}</p>
            <p className="font-mono">Predicted break: {fmt(data.bBreakSec)} s</p>
          </div>
        </div>
      )}
    </div>
  );
}
