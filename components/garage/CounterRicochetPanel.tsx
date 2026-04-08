"use client";

import { useMemo, useState } from "react";

import type { CanonicalPart } from "@/lib/schema";

type Props = {
  parts: CanonicalPart[];
};

const DEF_BREAKPOINTS: [number, number][] = [
  [900, 0.45],
  [1000, 0.4],
  [1100, 0.3],
  [1300, 0.15],
  [1500, 0],
];

type UnitEntry = {
  label: string;
  ideal: number;
  maxRic: number;
  attackType: string;
};

function piecewiseLinear(x: number, points: [number, number][]) {
  if (x <= points[0]![0]) return points[0]![1];
  if (x >= points[points.length - 1]![0]) return points[points.length - 1]![1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1]!;
    const [x2, y2] = points[i]!;
    if (x <= x2) {
      const t = (x - x1) / (x2 - x1);
      return y1 + t * (y2 - y1);
    }
  }
  return points[points.length - 1]![1];
}

function ricochetRange(ideal: number, maxRic: number, defense: number) {
  const m = piecewiseLinear(defense, DEF_BREAKPOINTS);
  return ideal + m * (maxRic - ideal);
}

function fmt(n: number) {
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "-";
}

function unitEntries(parts: CanonicalPart[]): UnitEntry[] {
  const out: UnitEntry[] = [];
  for (const p of parts) {
    const ideal = Number(p.baseStats.IdealRange);
    const maxRic = Number(p.baseStats.MaxRicochetRange);
    if (Number.isFinite(ideal) && Number.isFinite(maxRic)) {
      out.push({
        label: p.identity.name,
        ideal,
        maxRic,
        attackType: String(p.baseStats.AttackType ?? "Kinetic"),
      });
    }
    const chIdeal = Number(p.baseStats.ChgIdealRange);
    const chMax = Number(p.baseStats.MaxChgRicochetRange);
    if (Number.isFinite(chIdeal) && Number.isFinite(chMax)) {
      out.push({
        label: `${p.identity.name} (Charged)`,
        ideal: chIdeal,
        maxRic: chMax,
        attackType: String(p.baseStats.AttackType ?? "Kinetic"),
      });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

function rangePolyline(entry: UnitEntry) {
  const x0 = 850;
  const x1 = 1550;
  const pts = [x0, ...DEF_BREAKPOINTS.map((x) => x[0]), x1].map((def) => [
    def,
    ricochetRange(entry.ideal, entry.maxRic, def),
  ] as const);
  return pts;
}

export function CounterRicochetPanel({ parts }: Props) {
  const options = useMemo(() => unitEntries(parts), [parts]);
  const [defK, setDefK] = useState(1100);
  const [defE, setDefE] = useState(1100);
  const [unitA, setUnitA] = useState("");
  const [unitB, setUnitB] = useState("");
  const [unitC, setUnitC] = useState("");

  const selected = [unitA, unitB, unitC]
    .map((n) => options.find((o) => o.label === n))
    .filter((x): x is UnitEntry => Boolean(x));

  const xMin = 850;
  const xMax = 1550;
  const yMax = Math.max(
    430,
    ...selected.flatMap((u) => rangePolyline(u).map(([, y]) => y)),
  );
  const W = 720;
  const H = 360;
  const pad = { l: 52, r: 16, t: 10, b: 34 };
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;
  const sx = (x: number) => pad.l + ((x - xMin) / (xMax - xMin)) * pw;
  const sy = (y: number) => pad.t + ph - (y / yMax) * ph;

  const colors = ["#38bdf8", "#f59e0b", "#86efac"];
  const dashByType = (t: string) => (t === "Energy" ? "4 3" : "8 4");

  return (
    <div className="space-y-3 rounded border border-cyan-300/35 bg-cyan-950/20 p-3">
      <h3 className="text-sm font-semibold tracking-wide text-cyan-100">
        COUNTERS · RICOCHET
      </h3>
      <div className="grid gap-2 md:grid-cols-2">
        <label className="text-xs text-cyan-200/80">
          Kinetic Defense
          <input
            className="ml-2 w-20 rounded border border-cyan-300/45 bg-[#081724] px-2 py-1 text-xs text-cyan-50"
            type="number"
            min={850}
            max={1550}
            value={defK}
            onChange={(e) => setDefK(Math.min(1550, Math.max(850, Number(e.target.value))))}
          />
        </label>
        <label className="text-xs text-cyan-200/80">
          Energy Defense
          <input
            className="ml-2 w-20 rounded border border-cyan-300/45 bg-[#081724] px-2 py-1 text-xs text-cyan-50"
            type="number"
            min={850}
            max={1550}
            value={defE}
            onChange={(e) => setDefE(Math.min(1550, Math.max(850, Number(e.target.value))))}
          />
        </label>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {[unitA, unitB, unitC].map((v, i) => (
          <label key={i} className="text-xs text-cyan-200/80">
            Unit {i + 1}
            <select
              className="ml-2 max-w-[260px] rounded border border-cyan-300/45 bg-[#081724] px-2 py-1 text-xs text-cyan-50"
              value={v}
              onChange={(e) => (i === 0 ? setUnitA(e.target.value) : i === 1 ? setUnitB(e.target.value) : setUnitC(e.target.value))}
            >
              <option value="">(none)</option>
              {options.map((o) => (
                <option key={o.label} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-80 w-full rounded border border-cyan-300/20 bg-[#0b2032]">
        <line x1={sx(defK)} y1={pad.t} x2={sx(defK)} y2={pad.t + ph} stroke="#ef4444" strokeDasharray="8 4" strokeWidth={1.5} />
        <line x1={sx(defE)} y1={pad.t} x2={sx(defE)} y2={pad.t + ph} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5} />
        {selected.map((u, idx) => {
          const pts = rangePolyline(u);
          const pstr = pts.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");
          const pairedDef = u.attackType === "Energy" ? defE : defK;
          const markerY = ricochetRange(u.ideal, u.maxRic, pairedDef);
          return (
            <g key={u.label}>
              <polyline
                fill="none"
                points={pstr}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
                strokeDasharray={dashByType(u.attackType)}
              />
              <circle cx={sx(pairedDef)} cy={sy(markerY)} r={4} fill={colors[idx % colors.length]} />
            </g>
          );
        })}
        <text x={W / 2} y={H - 8} textAnchor="middle" className="fill-cyan-200 text-[10px]">Defense</text>
        <text x={8} y={H / 2} transform={`rotate(-90 8 ${H / 2})`} className="fill-cyan-200 text-[10px]">Ricochet Range</text>
      </svg>

      <div className="grid gap-1 text-xs text-cyan-100/90">
        {selected.map((u) => {
          const d = u.attackType === "Energy" ? defE : defK;
          return (
            <div key={u.label} className="font-mono">
              {u.label}: {fmt(ricochetRange(u.ideal, u.maxRic, d))} m
            </div>
          );
        })}
      </div>
    </div>
  );
}
