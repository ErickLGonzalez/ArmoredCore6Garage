"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { BuildAnalysis } from "@/lib/calc";
import type { BuildAssembly } from "@/lib/calc/types";
import {
  createInitialWeaponsTestState,
  mergeEvents,
  tickWeaponsTest,
} from "@/lib/garage/weapons-test/simulation";
import {
  DEFAULT_SIM_TUNING,
  type SimulationTuning,
} from "@/lib/garage/weapons-test/simulation-tuning";
import type {
  WeaponFxFamily,
  WeaponsTestSimulationState,
  WeaponsTestTickInput,
  WeaponTestEvent,
} from "@/lib/garage/weapons-test/types";
import {
  clipTimeBounds,
  eventTime,
  sortEventsByTime,
} from "@/lib/garage/weapons-test/replay-utils";
import { weaponLoadoutFromAssembly } from "@/lib/garage/weapons-test/weapon-loadout";

import { EventFeed } from "./EventFeed";
import { WeaponsTestAdvancedPanel } from "./WeaponsTestAdvancedPanel";
import { WeaponsTestArena } from "./WeaponsTestArena";
import { WeaponsTestControls } from "./WeaponsTestControls";
import { WeaponsTestHud } from "./WeaponsTestHud";

type Props = {
  assembly: BuildAssembly | null;
  analysis: BuildAnalysis | null;
  compareOn: boolean;
  compareAssembly: BuildAssembly | null;
  compareAnalysis: BuildAnalysis | null;
};

const STEP = 1 / 120;

type SimMode = "live" | "record" | "play";

function cloneTuning(): SimulationTuning {
  return JSON.parse(JSON.stringify(DEFAULT_SIM_TUNING)) as SimulationTuning;
}

function minCooldownForHud(
  loadout: ReturnType<typeof weaponLoadoutFromAssembly>,
  cooldowns: Record<string, number>,
  input: Pick<
    WeaponsTestTickInput,
    "multiWeapon" | "armedWeaponIds" | "activeWeaponId"
  >,
): number {
  let list = loadout;
  if (input.multiWeapon) {
    const armed = input.armedWeaponIds;
    list = loadout.filter(
      (w) => !armed || armed.size === 0 || armed.has(w.id),
    );
  } else {
    const one = loadout.find((w) => w.id === input.activeWeaponId);
    list = one ? [one] : [];
  }
  if (!list.length) return 0;
  return Math.min(...list.map((w) => cooldowns[w.id] ?? 0));
}

function isWeaponTestEventArray(v: unknown): v is WeaponTestEvent[] {
  return Array.isArray(v);
}

export function WeaponsTestTab({
  assembly,
  analysis,
  compareOn,
  compareAssembly,
  compareAnalysis,
}: Props) {
  const loadout = useMemo(
    () => weaponLoadoutFromAssembly(assembly),
    [assembly],
  );

  const loadoutKey = useMemo(() => loadout.map((w) => w.id).join("|"), [loadout]);

  const compareTargetAvailable = Boolean(
    compareOn && compareAnalysis && compareAssembly,
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quality, setQuality] = useState<"off" | "low" | "high">("low");
  const [multiWeapon, setMultiWeapon] = useState(false);
  const [autoFire, setAutoFire] = useState(false);
  const [targetModeUi, setTargetModeUi] = useState<"dummy" | "compare">(
    "dummy",
  );
  const [armedList, setArmedList] = useState<string[]>([]);

  const [tuning, setTuning] = useState<SimulationTuning>(cloneTuning);
  const [timeScale, setTimeScale] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [recording, setRecording] = useState(false);
  const [savedClip, setSavedClip] = useState<WeaponTestEvent[]>([]);
  const [playbackPlaying, setPlaybackPlaying] = useState(false);
  const [replayVisual, setReplayVisual] = useState<WeaponTestEvent[]>([]);
  const [hitPulse, setHitPulse] = useState(0);
  const [lastImpactDamage, setLastImpactDamage] = useState<number | null>(null);

  const [, setFrame] = useState(0);
  const fireRef = useRef(false);
  const simRef = useRef<WeaponsTestSimulationState | null>(null);
  const hitFlashRef = useRef(0);
  const rafCountRef = useRef(0);

  const simModeRef = useRef<SimMode>("live");
  const recordBufRef = useRef<WeaponTestEvent[]>([]);
  const playSortedRef = useRef<WeaponTestEvent[]>([]);
  const playT0Ref = useRef(0);
  const playIdxRef = useRef(0);
  const playAccRef = useRef(0);

  const bump = useCallback(() => {
    rafCountRef.current += 1;
    if (rafCountRef.current % 2 === 0) {
      setFrame((n) => n + 1);
    }
  }, []);

  const resolvedTargetMode: "dummy" | "compare" =
    compareTargetAvailable && targetModeUi === "compare"
      ? "compare"
      : "dummy";

  const buildCreateOptions = useCallback(() => {
    return {
      primaryWeaponId: selectedId ?? loadout[0]?.id ?? null,
      targetMode: resolvedTargetMode,
      targetAnalysis:
        resolvedTargetMode === "compare" ? compareAnalysis : null,
    };
  }, [
    selectedId,
    loadout,
    resolvedTargetMode,
    compareAnalysis,
  ]);

  const resetSim = useCallback(() => {
    if (!analysis) return;
    simModeRef.current = "live";
    setPlaybackPlaying(false);
    setReplayVisual([]);
    simRef.current = createInitialWeaponsTestState(
      analysis,
      loadout,
      buildCreateOptions(),
    );
    hitFlashRef.current = 0;
    setFrame((n) => n + 1);
  }, [analysis, loadout, buildCreateOptions]);

  const patchFamily = useCallback(
    (family: WeaponFxFamily, patch: Partial<SimulationTuning[WeaponFxFamily]>) => {
      setTuning((t) => ({
        ...t,
        [family]: { ...t[family], ...patch },
      }));
    },
    [],
  );

  const startRecord = useCallback(() => {
    recordBufRef.current = [];
    simModeRef.current = "record";
    setRecording(true);
  }, []);

  const stopRecord = useCallback(() => {
    simModeRef.current = "live";
    setRecording(false);
    setSavedClip([...recordBufRef.current]);
  }, []);

  const stopPlayback = useCallback(() => {
    simModeRef.current = "live";
    setPlaybackPlaying(false);
    setReplayVisual([]);
    playAccRef.current = 0;
    playIdxRef.current = 0;
  }, []);

  const playClip = useCallback(() => {
    if (!savedClip.length) return;
    playSortedRef.current = sortEventsByTime(savedClip);
    playT0Ref.current = clipTimeBounds(savedClip).t0;
    playIdxRef.current = 0;
    playAccRef.current = 0;
    simModeRef.current = "play";
    setReplayVisual([]);
    setPlaybackPlaying(true);
  }, [savedClip]);

  const exportClip = useCallback(() => {
    if (!savedClip.length) return;
    const blob = new Blob([JSON.stringify(savedClip, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "weapons-test-clip.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [savedClip]);

  const clearClip = useCallback(() => {
    setSavedClip([]);
  }, []);

  const importClip = useCallback((text: string) => {
    try {
      const parsed: unknown = JSON.parse(text);
      if (!isWeaponTestEventArray(parsed)) return;
      setSavedClip(parsed);
    } catch {
      /* ignore invalid JSON */
    }
  }, []);

  useEffect(() => {
    if (!compareOn) setTargetModeUi("dummy");
  }, [compareOn]);

  useEffect(() => {
    if (!compareTargetAvailable && targetModeUi === "compare") {
      setTargetModeUi("dummy");
    }
  }, [compareTargetAvailable, targetModeUi]);

  useEffect(() => {
    setArmedList(loadout.map((w) => w.id));
  }, [loadoutKey, loadout]);

  useEffect(() => {
    if (!loadout.length) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !loadout.some((w) => w.id === selectedId)) {
      setSelectedId(loadout[0]!.id);
    }
  }, [loadout, loadoutKey, selectedId]);

  useEffect(() => {
    if (!analysis) {
      simRef.current = null;
      return;
    }
    simModeRef.current = "live";
    setPlaybackPlaying(false);
    setReplayVisual([]);
    simRef.current = createInitialWeaponsTestState(
      analysis,
      loadout,
      {
        primaryWeaponId: loadout[0]?.id ?? null,
        targetMode: resolvedTargetMode,
        targetAnalysis:
          resolvedTargetMode === "compare" ? compareAnalysis : null,
      },
    );
    setFrame((n) => n + 1);
  }, [
    analysis,
    loadoutKey,
    loadout,
    resolvedTargetMode,
    compareAnalysis,
  ]);

  useEffect(() => {
    if (!simRef.current || !selectedId) return;
    simRef.current = {
      ...simRef.current,
      activeWeaponId: selectedId,
    };
    bump();
  }, [selectedId, bump]);

  const toggleArmed = useCallback((id: string) => {
    setArmedList((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        return next.length ? next : prev;
      }
      return [...prev, id];
    });
  }, []);

  useEffect(() => {
    if (!analysis) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const applyImpacts = (events: WeaponTestEvent[]) => {
      for (const e of events) {
        if (e.type === "projectile_impact") {
          hitFlashRef.current = performance.now();
          setHitPulse((n) => n + 1);
          setLastImpactDamage(e.impact);
        }
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;

      const mode = simModeRef.current;

      if (mode === "play") {
        playAccRef.current += dt * playbackSpeed;
        const sorted = playSortedRef.current;
        const t0 = playT0Ref.current;
        const batch: WeaponTestEvent[] = [];
        while (
          playIdxRef.current < sorted.length &&
          eventTime(sorted[playIdxRef.current]!) - t0 <= playAccRef.current
        ) {
          batch.push(sorted[playIdxRef.current]!);
          playIdxRef.current += 1;
        }
        if (batch.length) {
          setReplayVisual((prev) => mergeEvents(prev, batch));
          applyImpacts(batch);
        }
        if (sorted.length && playIdxRef.current >= sorted.length) {
          simModeRef.current = "live";
          setPlaybackPlaying(false);
        }
        bump();
        raf = requestAnimationFrame(loop);
        return;
      }

      acc += dt * timeScale;

      const input: WeaponsTestTickInput = {
        fireHeld: fireRef.current,
        autoFire,
        multiWeapon,
        armedWeaponIds: multiWeapon ? new Set(armedList) : null,
        activeWeaponId: selectedId,
      };

      while (acc >= STEP) {
        const cur = simRef.current;
        if (!cur) break;
        const next = tickWeaponsTest(
          cur,
          STEP,
          analysis,
          loadout,
          input,
          tuning,
        );
        if (simModeRef.current === "record") {
          recordBufRef.current.push(...next.events);
        }
        applyImpacts(next.events);
        simRef.current = {
          ...next,
          events: mergeEvents(cur.events, next.events),
          activeWeaponId: selectedId ?? next.activeWeaponId,
        };
        acc -= STEP;
      }
      bump();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [
    analysis,
    loadout,
    loadoutKey,
    selectedId,
    bump,
    autoFire,
    multiWeapon,
    armedList,
    tuning,
    timeScale,
    playbackSpeed,
  ]);

  const sim = simRef.current;
  const hitFlash =
    Boolean(sim) && performance.now() - hitFlashRef.current < 160;

  const tickInputPreview = useMemo(
    () =>
      ({
        multiWeapon,
        armedWeaponIds: multiWeapon ? new Set(armedList) : null,
        activeWeaponId: selectedId,
      }) as const,
    [multiWeapon, armedList, selectedId],
  );

  const hudCooldown = sim
    ? minCooldownForHud(loadout, sim.weaponCooldowns, tickInputPreview)
    : 0;

  const targetHudLabel =
    sim?.targetMode === "compare"
      ? "Target: AC SET B (stagger cap from compare build)"
      : "Target: dummy AC (stagger cap from your stability)";

  const displayEvents = playbackPlaying ? replayVisual : sim?.events ?? [];
  const visualTimeScale = playbackPlaying ? playbackSpeed : timeScale;
  const particleSceneKey = playbackPlaying ? "replay" : "live";

  if (!assembly || !analysis) {
    return (
      <p className="ac6-note">
        Assemble AC SET A to run the weapons sandbox (needs valid parts).
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="ac6-block p-2">
        <h3 className="ac6-block-title">WEAPONS TEST</h3>
        <p className="mt-1 text-[10px] leading-snug text-cyan-200/65">
          Phase 3: guided missile arcs, per-family sim tuning, slow-motion time
          scale, record/play event clips, and target hit feedback (shake + impact
          numbers).
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,240px)_1fr]">
        <div className="space-y-2">
          <WeaponsTestControls
            loadout={loadout}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onFireDown={() => {
              fireRef.current = true;
            }}
            onFireUp={() => {
              fireRef.current = false;
            }}
            onReset={resetSim}
            quality={quality}
            onQuality={setQuality}
            multiWeapon={multiWeapon}
            onMultiWeapon={setMultiWeapon}
            autoFire={autoFire}
            onAutoFire={setAutoFire}
            armedList={armedList}
            onToggleArmed={toggleArmed}
            targetMode={targetModeUi}
            onTargetMode={setTargetModeUi}
            compareTargetAvailable={compareTargetAvailable}
            disabled={loadout.length === 0}
          />
          <WeaponsTestAdvancedPanel
            tuning={tuning}
            onPatchFamily={patchFamily}
            timeScale={timeScale}
            onTimeScale={setTimeScale}
            playbackSpeed={playbackSpeed}
            onPlaybackSpeed={setPlaybackSpeed}
            recording={recording}
            onStartRecord={startRecord}
            onStopRecord={stopRecord}
            playbackPlaying={playbackPlaying}
            onPlay={playClip}
            onStopPlayback={stopPlayback}
            savedClipCount={savedClip.length}
            onExportClip={exportClip}
            onClearClip={clearClip}
            onImportClip={importClip}
          />
          {sim ? (
            <WeaponsTestHud
              currentEnergy={sim.currentEnergy}
              maxEnergy={sim.maxEnergy}
              targetStagger={sim.targetStagger}
              targetStaggerMax={sim.targetStaggerMax}
              timeSec={sim.time}
              cooldownSec={hudCooldown}
              targetLabel={targetHudLabel}
            />
          ) : null}
        </div>

        <div className="space-y-2">
          {sim ? (
            <WeaponsTestArena
              targetMode={sim.targetMode}
              compareAnalysis={
                sim.targetMode === "compare" ? compareAnalysis : null
              }
              events={displayEvents}
              quality={quality}
              hitFlash={hitFlash}
              hitPulse={hitPulse}
              lastImpactDamage={lastImpactDamage}
              visualTimeScale={visualTimeScale}
              particleSceneKey={particleSceneKey}
            />
          ) : null}
          {sim ? <EventFeed events={displayEvents} /> : null}
        </div>
      </div>
    </div>
  );
}
