"use client";

type Props = {
  current: number;
  max: number;
  label?: string;
};

export function StaggerBar({ current, max, label = "TARGET STAGGER" }: Props) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  return (
    <div className="w-full">
      <div className="mb-0.5 flex justify-between text-[9px] uppercase tracking-wide text-rose-200/75">
        <span>{label}</span>
        <span className="font-mono text-rose-100/90">
          {Math.round(current)} / {Math.round(max)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm border border-rose-800/45 bg-rose-950/50">
        <div
          className="h-full bg-gradient-to-r from-rose-900 to-amber-400 transition-[width] duration-75"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
