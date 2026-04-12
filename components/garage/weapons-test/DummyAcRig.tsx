"use client";

type Props = {
  hitFlash: boolean;
  hitPulse: number;
  lastImpactDamage: number | null;
  label?: string;
};

/** Simple silhouette stand-in for a dummy AC target. */
export function DummyAcRig({
  hitFlash,
  hitPulse,
  lastImpactDamage,
  label = "DUMMY AC",
}: Props) {
  return (
    <div
      className={`relative flex h-full min-h-[140px] flex-col items-center justify-end overflow-hidden border-2 border-[var(--ui-border)] p-2 ${
        hitFlash ? "ring-2 ring-amber-400/70" : ""
      }`}
      style={{
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--ui-panel-bottom) 55%, transparent), color-mix(in srgb, black 88%, var(--ui-panel-bottom)))",
      }}
    >
      <p className="absolute left-2 top-2 z-[2] text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-200/65">
        {label}
      </p>
      {lastImpactDamage != null && hitPulse > 0 ? (
        <span
          key={hitPulse}
          className="pointer-events-none absolute left-1/2 top-[32%] z-[3] font-mono text-sm font-bold tabular-nums text-amber-300 ac6-impact-float"
        >
          +{Math.round(lastImpactDamage)}
        </span>
      ) : null}
      <div
        key={hitPulse}
        className={hitPulse > 0 ? "ac6-target-shake flex w-full flex-1 flex-col items-center justify-end" : "flex w-full flex-1 flex-col items-center justify-end"}
      >
        <svg
          viewBox="0 0 120 160"
          className="h-28 w-24 text-cyan-500/35"
          aria-hidden
        >
          <rect
            x="44"
            y="28"
            width="32"
            height="28"
            rx="4"
            fill="currentColor"
          />
          <rect
            x="34"
            y="56"
            width="52"
            height="56"
            rx="6"
            fill="currentColor"
          />
          <rect
            x="22"
            y="72"
            width="18"
            height="36"
            rx="4"
            fill="currentColor"
          />
          <rect
            x="80"
            y="72"
            width="18"
            height="36"
            rx="4"
            fill="currentColor"
          />
          <rect
            x="48"
            y="112"
            width="24"
            height="40"
            rx="5"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}
