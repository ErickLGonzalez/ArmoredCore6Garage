"use client";

import { useCallback, useRef, type ChangeEvent } from "react";

import type { SimulationTuning } from "@/lib/garage/weapons-test/simulation-tuning";
import type { WeaponFxFamily } from "@/lib/garage/weapons-test/types";

type Props = {
  tuning: SimulationTuning;
  onPatchFamily: (
    family: WeaponFxFamily,
    patch: Partial<SimulationTuning[WeaponFxFamily]>,
  ) => void;
  timeScale: number;
  onTimeScale: (v: number) => void;
  playbackSpeed: number;
  onPlaybackSpeed: (v: number) => void;
  recording: boolean;
  onStartRecord: () => void;
  onStopRecord: () => void;
  playbackPlaying: boolean;
  onPlay: () => void;
  onStopPlayback: () => void;
  savedClipCount: number;
  onExportClip: () => void;
  onClearClip: () => void;
  onImportClip: (eventsJson: string) => void;
};

const FAMILIES: WeaponFxFamily[] = ["kinetic", "laser", "explosive"];

function MulSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5 text-[9px] text-cyan-200/70">
      <span className="font-semibold uppercase tracking-[0.08em]">{label}</span>
      <input
        type="range"
        min={0.5}
        max={1.5}
        step={0.05}
        value={value}
        onChange={(ev) => onChange(Number(ev.target.value))}
        className="h-1 w-full accent-cyan-500"
      />
      <span className="font-mono text-cyan-100/90">{value.toFixed(2)}×</span>
    </label>
  );
}

export function WeaponsTestAdvancedPanel({
  tuning,
  onPatchFamily,
  timeScale,
  onTimeScale,
  playbackSpeed,
  onPlaybackSpeed,
  recording,
  onStartRecord,
  onStopRecord,
  playbackPlaying,
  onPlay,
  onStopPlayback,
  savedClipCount,
  onExportClip,
  onClearClip,
  onImportClip,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      const f = ev.target.files?.[0];
      ev.target.value = "";
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        onImportClip(text);
      };
      reader.readAsText(f);
    },
    [onImportClip],
  );

  return (
    <div className="ac6-block space-y-2 p-2">
      <h4 className="ac6-block-title text-[10px]">ADVANCED (PHASE 3)</h4>

      <div className="space-y-1">
        <label className="flex items-center justify-between gap-2 text-[9px] text-cyan-200/75">
          <span className="font-semibold uppercase tracking-[0.1em]">
            Sim time scale
          </span>
          <span className="font-mono">{timeScale.toFixed(2)}×</span>
        </label>
        <input
          type="range"
          min={0.15}
          max={1.5}
          step={0.05}
          value={timeScale}
          onChange={(ev) => onTimeScale(Number(ev.target.value))}
          disabled={playbackPlaying}
          className="h-1 w-full accent-cyan-500"
        />
      </div>

      <div className="space-y-1 border-t-2 border-[var(--ui-border)] pt-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-cyan-200/60">
          Per-family tuning
        </p>
        <div className="grid gap-2">
          {FAMILIES.map((fam) => (
            <div key={fam} className="ac6-inner-frame p-1.5">
              <p className="mb-1 text-[9px] font-mono uppercase text-cyan-300/80">
                {fam}
              </p>
              <div className="grid grid-cols-3 gap-1">
                <MulSlider
                  label="Impact"
                  value={tuning[fam].impactMul}
                  onChange={(v) => onPatchFamily(fam, { impactMul: v })}
                />
                <MulSlider
                  label="EN cost"
                  value={tuning[fam].enMul}
                  onChange={(v) => onPatchFamily(fam, { enMul: v })}
                />
                <MulSlider
                  label="Cooldown"
                  value={tuning[fam].cooldownMul}
                  onChange={(v) => onPatchFamily(fam, { cooldownMul: v })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1 border-t-2 border-[var(--ui-border)] pt-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-cyan-200/60">
          Replay
        </p>
        <div className="flex flex-wrap gap-1">
          {!recording ? (
            <button
              type="button"
              className="ac6-btn ac6-btn-sm"
              onClick={onStartRecord}
              disabled={playbackPlaying}
            >
              Record
            </button>
          ) : (
            <button
              type="button"
              className="ac6-btn ac6-btn-sm ring-1 ring-rose-500/60"
              onClick={onStopRecord}
            >
              Stop & save
            </button>
          )}
          <button
            type="button"
            className="ac6-btn ac6-btn-sm"
            onClick={playbackPlaying ? onStopPlayback : onPlay}
            disabled={!playbackPlaying && savedClipCount === 0}
          >
            {playbackPlaying ? "Stop playback" : "Play clip"}
          </button>
        </div>
        <p className="text-[8px] text-cyan-200/45">
          Saved events: {savedClipCount}
          {recording ? " · recording…" : ""}
        </p>
        <label className="flex items-center justify-between gap-2 text-[9px] text-cyan-200/75">
          <span>Playback speed</span>
          <span className="font-mono">{playbackSpeed.toFixed(2)}×</span>
        </label>
        <input
          type="range"
          min={0.2}
          max={2}
          step={0.05}
          value={playbackSpeed}
          onChange={(ev) => onPlaybackSpeed(Number(ev.target.value))}
          className="h-1 w-full accent-amber-500"
        />
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className="ac6-btn ac6-btn-sm"
            onClick={onExportClip}
            disabled={savedClipCount === 0}
          >
            Export JSON
          </button>
          <button type="button" className="ac6-btn ac6-btn-sm" onClick={onClearClip}>
            Clear clip
          </button>
          <button
            type="button"
            className="ac6-btn ac6-btn-sm"
            onClick={() => fileRef.current?.click()}
          >
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onFile}
          />
        </div>
      </div>
    </div>
  );
}
