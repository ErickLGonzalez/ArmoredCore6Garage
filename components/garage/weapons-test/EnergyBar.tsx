"use client";

type Props = {
  current: number;
  max: number;
  label?: string;
};

export function EnergyBar({ current, max, label = "ATTACKER EN" }: Props) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  return (
    <div className="w-full">
      <div className="mb-0.5 flex justify-between text-[9px] uppercase tracking-wide text-cyan-200/70">
        <span>{label}</span>
        <span className="font-mono text-cyan-100/90">
          {Math.round(current)} / {Math.round(max)}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden border-2 border-[var(--ui-border)]"
        style={{
          background: "color-mix(in srgb, var(--ui-panel-bottom) 90%, black)",
        }}
      >
        <div
          className="h-full transition-[width] duration-75"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, var(--ui-tab-bottom), var(--ui-tab-active-top))",
          }}
        />
      </div>
    </div>
  );
}
