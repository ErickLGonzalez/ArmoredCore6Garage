"use client";

/**
 * SVG analogue of the reference `RangePlot` (StatRows.jsx): FCS assist vs distance
 * with vertical ideal-range markers for the four unit slots.
 */
type Props = {
  /** Seven values: RA, LA, RB, LB ranges (nullable → skip line), then close/med/long assist. */
  primary: number[];
  compare?: number[] | null;
  className?: string;
};

const X_MAX = 320;
const Y_MAX = 95;
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

function assistPolyline(
  close: number,
  medium: number,
  long: number,
): string {
  const pts: [number, number][] = [
    [0, close],
    [120, close],
    [140, medium],
    [250, medium],
    [270, long],
    [320, long],
  ];
  return pts.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");
}

export function AimAssistPlot({ primary, compare, className }: Props) {
  const [ra, la, rb, lb] = primary;
  const c = primary[4] ?? 0;
  const m = primary[5] ?? 0;
  const l = primary[6] ?? 0;

  const weaponRanges = [ra, la, rb, lb].map((r) =>
    r != null && Number.isFinite(r) ? Math.min(Number(r), 300) : null,
  );

  let compareLine: string | null = null;
  if (
    compare &&
    compare.length >= 7 &&
    [compare[4], compare[5], compare[6]].every((n) => Number.isFinite(Number(n)))
  ) {
    compareLine = assistPolyline(
      Number(compare[4]),
      Number(compare[5]),
      Number(compare[6]),
    );
  }

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Aim assist vs distance: FCS tiers and weapon ideal ranges"
    >
      <title>Aim assist vs distance</title>
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
      {weaponRanges.map(
        (r, i) =>
          r != null && (
            <line
              key={i}
              x1={sx(r)}
              x2={sx(r)}
              y1={PAD_T}
              y2={PAD_T + IH}
              className="stroke-red-500/90 dark:stroke-red-400/90"
              strokeWidth={1.5}
            />
          ),
      )}
      {compareLine ? (
        <polyline
          fill="none"
          points={compareLine}
          className="stroke-zinc-400 dark:stroke-zinc-500"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
      ) : null}
      <polyline
        fill="none"
        points={assistPolyline(c, m, l)}
        className="stroke-cyan-600 dark:stroke-cyan-400"
        strokeWidth={2.5}
      />
      <text
        x={PAD_L}
        y={H - 8}
        className="fill-zinc-500 text-[10px] dark:fill-zinc-400"
      >
        Distance (m) 0–320
      </text>
      <text
        x={4}
        y={PAD_T + IH / 2}
        className="fill-zinc-500 text-[10px] dark:fill-zinc-400"
        transform={`rotate(-90 10 ${PAD_T + IH / 2})`}
      >
        Assist
      </text>
    </svg>
  );
}
