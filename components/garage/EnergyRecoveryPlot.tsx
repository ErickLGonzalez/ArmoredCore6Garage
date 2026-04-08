"use client";

import type { EnergyRecoveryCurves } from "@/lib/garage/plot-data";

type Props = {
  primary: EnergyRecoveryCurves;
  compare?: EnergyRecoveryCurves | null;
  className?: string;
};

const PAD_L = 52;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 36;

function curveBounds(c: EnergyRecoveryCurves): { tMax: number; enMax: number } {
  const tMax = Math.max(c.normal.t[2] ?? 0, c.redline.t[2] ?? 0, 1);
  const enMax = Math.max(c.normal.en[2] ?? 0, c.redline.en[2] ?? 0, 1);
  return { tMax, enMax };
}

function polylinePoints(
  curve: { t: number[]; en: number[] },
  tMax: number,
  enMax: number,
  plotW: number,
  plotH: number,
): string {
  const sx = (t: number) => PAD_L + (t / tMax) * plotW;
  const sy = (en: number) => PAD_T + plotH - (en / enMax) * plotH;
  return curve.t.map((t, i) => `${sx(t)},${sy(curve.en[i]!)}`).join(" ");
}

/** Normal (cyan) and redline (red) EN recharge; dashed overlay when comparing. */
export function EnergyRecoveryPlot({ primary, compare, className }: Props) {
  const plotW = 280;
  const plotH = 160;
  const W = PAD_L + plotW + PAD_R;
  const H = PAD_T + plotH + PAD_B;

  const b0 = curveBounds(primary);
  const b1 = compare ? curveBounds(compare) : b0;
  const tMax = Math.max(b0.tMax, b1.tMax) * 1.06;
  const enMax = Math.max(b0.enMax, b1.enMax) * 1.1;

  const primaryNormal = polylinePoints(primary.normal, tMax, enMax, plotW, plotH);
  const primaryRed = polylinePoints(primary.redline, tMax, enMax, plotW, plotH);
  const compareNormal = compare
    ? polylinePoints(compare.normal, tMax, enMax, plotW, plotH)
    : "";
  const compareRed = compare
    ? polylinePoints(compare.redline, tMax, enMax, plotW, plotH)
    : "";

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Energy recovery over time: normal (cyan) and redline (red) recharge curves"
    >
      <title>Energy recovery</title>
      <rect
        x={PAD_L}
        y={PAD_T}
        width={plotW}
        height={plotH}
        className="fill-zinc-100/80 dark:fill-zinc-800/50"
        rx={4}
      />
      {compare ? (
        <>
          <polyline
            fill="none"
            points={compareNormal}
            className="stroke-zinc-400 dark:stroke-zinc-500"
            strokeWidth={1.75}
            strokeDasharray="5 4"
          />
          <polyline
            fill="none"
            points={compareRed}
            className="stroke-rose-400/80 dark:stroke-rose-500/80"
            strokeWidth={1.75}
            strokeDasharray="5 4"
          />
        </>
      ) : null}
      <polyline
        fill="none"
        points={primaryNormal}
        className="stroke-cyan-600 dark:stroke-cyan-400"
        strokeWidth={2.25}
      />
      <polyline
        fill="none"
        points={primaryRed}
        className="stroke-red-500 dark:stroke-red-400"
        strokeWidth={2.25}
      />
      <text
        x={PAD_L}
        y={H - 8}
        className="fill-zinc-500 text-[10px] dark:fill-zinc-400"
      >
        Time (s)
      </text>
      <text
        x={6}
        y={PAD_T + plotH / 2}
        className="fill-zinc-500 text-[10px] dark:fill-zinc-400"
        transform={`rotate(-90 12 ${PAD_T + plotH / 2})`}
      >
        EN
      </text>
      <text
        x={PAD_L + plotW - 2}
        y={PAD_T + 12}
        className="fill-zinc-400 text-[9px] dark:fill-zinc-500"
        textAnchor="end"
      >
        Cyan: normal · Red: redline
      </text>
    </svg>
  );
}
