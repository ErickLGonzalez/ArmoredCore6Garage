"use client";

/** SVG analogue of reference `RecoilPlot`: recoil accumulation over a short time window. */
type Props = {
  primary: [number, number][];
  compare?: [number, number][] | null;
  className?: string;
};

const X_MAX = 5;
const Y_MAX = 105;
const PAD_L = 48;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 36;
const W = 360;
const H = 140;
const IW = W - PAD_L - PAD_R;
const IH = H - PAD_T - PAD_B;

function sx(x: number): number {
  return PAD_L + (x / X_MAX) * IW;
}

function sy(y: number): number {
  return PAD_T + IH - (y / Y_MAX) * IH;
}

function toPoints(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");
}

export function RecoilPlot({ primary, compare, className }: Props) {
  const mainPts = primary.length ? toPoints(primary) : "";

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Recoil accumulation over time"
    >
      <title>Recoil accumulation</title>
      <rect
        x={PAD_L}
        y={PAD_T}
        width={IW}
        height={IH}
        className="fill-zinc-100/80 dark:fill-zinc-800/50"
        rx={4}
      />
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={PAD_L}
          x2={PAD_L + IW}
          y1={PAD_T + t * IH}
          y2={PAD_T + t * IH}
          className="stroke-zinc-200 dark:stroke-zinc-700"
          strokeWidth={0.5}
        />
      ))}
      {compare && compare.length > 0 ? (
        <polyline
          fill="none"
          points={toPoints(compare)}
          className="stroke-zinc-400 dark:stroke-zinc-500"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
      ) : null}
      {mainPts ? (
        <polyline
          fill="none"
          points={mainPts}
          className="stroke-cyan-600 dark:stroke-cyan-400"
          strokeWidth={2.5}
        />
      ) : null}
      <text
        x={PAD_L}
        y={H - 8}
        className="fill-zinc-500 text-[10px] dark:fill-zinc-400"
      >
        Time (s) 0–5
      </text>
      <text
        x={4}
        y={PAD_T + IH / 2}
        className="fill-zinc-500 text-[10px] dark:fill-zinc-400"
        transform={`rotate(-90 10 ${PAD_T + IH / 2})`}
      >
        Recoil
      </text>
    </svg>
  );
}
