"use client";

import type { WeaponLoadoutEntry } from "@/lib/garage/weapons-test/types";

type Props = {
  loadout: WeaponLoadoutEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFireDown: () => void;
  onFireUp: () => void;
  onReset: () => void;
  quality: "off" | "low" | "high";
  onQuality: (q: "off" | "low" | "high") => void;
  multiWeapon: boolean;
  onMultiWeapon: (v: boolean) => void;
  autoFire: boolean;
  onAutoFire: (v: boolean) => void;
  armedList: string[];
  onToggleArmed: (weaponId: string) => void;
  targetMode: "dummy" | "compare";
  onTargetMode: (m: "dummy" | "compare") => void;
  compareTargetAvailable: boolean;
  disabled?: boolean;
};

const btn =
  "rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors";

const toggleBtn = (on: boolean) =>
  `${btn} ${
    on
      ? "border-cyan-400/55 bg-cyan-950/55 text-cyan-50"
      : "border-cyan-800/40 text-cyan-200/65"
  }`;

export function WeaponsTestControls({
  loadout,
  selectedId,
  onSelect,
  onFireDown,
  onFireUp,
  onReset,
  quality,
  onQuality,
  multiWeapon,
  onMultiWeapon,
  autoFire,
  onAutoFire,
  armedList,
  onToggleArmed,
  targetMode,
  onTargetMode,
  compareTargetAvailable,
  disabled,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <span className="text-[9px] uppercase tracking-wide text-cyan-200/55">
          Target
        </span>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={toggleBtn(targetMode === "dummy")}
            disabled={disabled}
            onClick={() => onTargetMode("dummy")}
          >
            Dummy AC
          </button>
          <button
            type="button"
            className={toggleBtn(targetMode === "compare")}
            disabled={disabled || !compareTargetAvailable}
            onClick={() => onTargetMode("compare")}
            title={
              !compareTargetAvailable
                ? "Enable compare (AC SET B) in the build tab"
                : undefined
            }
          >
            AC SET B
          </button>
        </div>
      </div>

      <label className="block text-[10px] uppercase tracking-wide text-cyan-200/70">
        Primary slot (single mode)
        <select
          className="ac6-slot-select mt-0.5 w-full border-2 px-1.5 py-1 text-[11px]"
          value={selectedId ?? ""}
          disabled={disabled || loadout.length === 0}
          onChange={(e) => onSelect(e.target.value)}
        >
          {loadout.length === 0 ? (
            <option value="">No weapons</option>
          ) : (
            loadout.map((w) => (
              <option
                key={w.id}
                value={w.id}
              >
                {w.slot}: {w.name} ({w.family})
              </option>
            ))
          )}
        </select>
      </label>

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className={toggleBtn(multiWeapon)}
          disabled={disabled}
          onClick={() => onMultiWeapon(!multiWeapon)}
        >
          Multi-weapon
        </button>
        <button
          type="button"
          className={toggleBtn(autoFire)}
          disabled={disabled || loadout.length === 0}
          onClick={() => onAutoFire(!autoFire)}
        >
          Auto-fire
        </button>
      </div>

      {multiWeapon && loadout.length > 0 ? (
        <div className="rounded border border-cyan-800/25 bg-cyan-950/15 px-1.5 py-1">
          <p className="mb-1 text-[9px] uppercase text-cyan-200/50">
            Armed (salvo)
          </p>
          <div className="flex flex-col gap-0.5">
            {loadout.map((w) => (
              <label
                key={w.id}
                className="flex cursor-pointer items-center gap-1.5 text-[10px] text-cyan-100/85"
              >
                <input
                  type="checkbox"
                  className="accent-cyan-400"
                  checked={armedList.includes(w.id)}
                  onChange={() => onToggleArmed(w.id)}
                />
                <span>
                  {w.slot}: {w.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${btn} border-cyan-600/50 bg-cyan-900/40 text-cyan-100 hover:bg-cyan-800/50 active:scale-[0.98]`}
          disabled={disabled || loadout.length === 0}
          onMouseDown={onFireDown}
          onMouseUp={onFireUp}
          onMouseLeave={onFireUp}
          onTouchStart={(e) => {
            e.preventDefault();
            onFireDown();
          }}
          onTouchEnd={onFireUp}
        >
          Fire (hold)
        </button>
        <button
          type="button"
          className={`${btn} border-zinc-600/50 bg-zinc-900/40 text-zinc-200 hover:bg-zinc-800/50`}
          disabled={disabled}
          onClick={onReset}
        >
          Reset
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        <span className="w-full text-[9px] uppercase text-cyan-200/55">
          FX quality
        </span>
        {(["low", "high", "off"] as const).map((q) => (
          <button
            key={q}
            type="button"
            className={`${btn} ${
              quality === q
                ? "border-cyan-400/60 bg-cyan-950/60 text-cyan-50"
                : "border-cyan-800/40 text-cyan-200/70"
            }`}
            onClick={() => onQuality(q)}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
