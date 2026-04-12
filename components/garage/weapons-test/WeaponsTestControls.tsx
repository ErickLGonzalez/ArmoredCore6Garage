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

const tab = "classic-tab text-[10px] focus-visible:outline-none";

const toggleTab = (on: boolean) => `${tab} ${on ? "classic-tab-active" : ""}`;

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
        <p className="ac6-chart-hint m-0">Target</p>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={toggleTab(targetMode === "dummy")}
            disabled={disabled}
            onClick={() => onTargetMode("dummy")}
          >
            Dummy AC
          </button>
          <button
            type="button"
            className={toggleTab(targetMode === "compare")}
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
              <option key={w.id} value={w.id}>
                {w.slot}: {w.name} ({w.family})
              </option>
            ))
          )}
        </select>
      </label>

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className={toggleTab(multiWeapon)}
          disabled={disabled}
          onClick={() => onMultiWeapon(!multiWeapon)}
        >
          Multi-weapon
        </button>
        <button
          type="button"
          className={toggleTab(autoFire)}
          disabled={disabled || loadout.length === 0}
          onClick={() => onAutoFire(!autoFire)}
        >
          Auto-fire
        </button>
      </div>

      {multiWeapon && loadout.length > 0 ? (
        <div className="ac6-inner-frame px-1.5 py-1">
          <p className="ac6-chart-hint m-0 mb-1">Armed (salvo)</p>
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
          className="classic-tab classic-tab-active text-[10px] focus-visible:outline-none disabled:opacity-40"
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
          className="ac6-btn text-[10px] focus-visible:outline-none disabled:opacity-40"
          disabled={disabled}
          onClick={onReset}
        >
          Reset
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        <span className="w-full ac6-chart-hint">FX quality</span>
        {(["low", "high", "off"] as const).map((q) => (
          <button
            key={q}
            type="button"
            className={toggleTab(quality === q)}
            onClick={() => onQuality(q)}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
