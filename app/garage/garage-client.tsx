"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CounterRicochetPanel } from "@/components/garage/CounterRicochetPanel";
import { CounterMatchupTTKPanel } from "@/components/garage/CounterMatchupTTKPanel";
import { CounterStaggerBreakpointsPanel } from "@/components/garage/CounterStaggerBreakpointsPanel";
import {
  GarageAnalysisBlock,
  GarageBuildDiffPreview,
  GarageLegacyStatGroupsSection,
  GarageSlotColumn,
} from "@/components/garage/GarageBuildPanels";
import { MechViewerCanvas } from "@/components/garage/MechViewerCanvas";
import { GarageCenterPanel } from "@/components/garage/layout/GarageCenterPanel";
import { GarageLeftPanel } from "@/components/garage/layout/GarageLeftPanel";
import { GarageRightPanel } from "@/components/garage/layout/GarageRightPanel";
import { GarageShell } from "@/components/garage/layout/GarageShell";
import { PartsTablePanel } from "@/components/garage/PartsTablePanel";
import { StandardAcViewer } from "@/components/garage/StandardAcViewer";
import {
  REQUIRED_ASSEMBLY_SLOTS,
  analyzeBuild,
  computeFullAccuracy,
  type BuildAnalysis,
} from "@/lib/calc";
import { assemblyFromGarageIds } from "@/lib/garage/assembly-from-ids";
import { decodeGarageBuild, encodeGarageBuild } from "@/lib/garage/build-url";
import type { GarageBuildIds } from "@/lib/garage/default-assembly";
import {
  partsForSlot,
  sortPartsByName,
  type RequiredSlot,
} from "@/lib/garage/slot-options";
import type { CanonicalPart } from "@/lib/schema";
import { simulateBattle } from "@/src/lib/battle";
import { generateCounterBuilds } from "@/src/lib/counters";
import { optimizeAdvanced } from "@/src/lib/optimizer";
import { useGarageStore } from "@/src/lib/store/garage-store";

type Props = {
  parts: CanonicalPart[];
  defaultBuild: GarageBuildIds;
  initialQueryB: string | null;
  initialQueryB2: string | null;
};

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 10_000) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumSignificantDigits: 5 });
}

function initialBuildsFromQuery(
  parts: CanonicalPart[],
  defaultBuild: GarageBuildIds,
  initialQueryB: string | null,
  initialQueryB2: string | null,
): {
  buildA: GarageBuildIds;
  buildB: GarageBuildIds;
  compareOn: boolean;
} {
  const validIds = new Set(parts.map((p) => p.identity.id));
  const buildA = initialQueryB
    ? decodeGarageBuild(initialQueryB, validIds, defaultBuild)
    : { ...defaultBuild };
  const compareOn = Boolean(initialQueryB2);
  const buildB = initialQueryB2
    ? decodeGarageBuild(initialQueryB2, validIds, defaultBuild)
    : { ...defaultBuild };
  return { buildA, buildB, compareOn };
}

export function GarageClient({
  parts,
  defaultBuild,
  initialQueryB,
  initialQueryB2,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const byId = useMemo(
    () => new Map(parts.map((p) => [p.identity.id, p] as const)),
    [parts],
  );

  const optionsBySlot = useMemo(() => {
    const m = new Map<RequiredSlot, CanonicalPart[]>();
    for (const slot of REQUIRED_ASSEMBLY_SLOTS) {
      m.set(slot, sortPartsByName(partsForSlot(parts, slot)));
    }
    return m;
  }, [parts]);

  const expansionOptions = useMemo(
    () => sortPartsByName(partsForSlot(parts, "expansion")),
    [parts],
  );

  const initialUrl = useRef(
    initialBuildsFromQuery(parts, defaultBuild, initialQueryB, initialQueryB2),
  );
  const {
    initialized,
    initialize,
    buildA: storeBuildA,
    buildB: storeBuildB,
    compareOn,
    engagementM,
    activeTab,
    counterTab,
    setBuildA,
    setBuildB,
    setCompareOn,
    setEngagementM,
    setActiveTab,
    setCounterTab,
  } = useGarageStore();

  useEffect(() => {
    initialize(
      initialUrl.current.buildA,
      initialUrl.current.buildB,
      initialUrl.current.compareOn,
    );
  }, [initialize]);

  const buildA = storeBuildA ?? initialUrl.current.buildA;
  const buildB = storeBuildB ?? initialUrl.current.buildB;

  useEffect(() => {
    if (!initialized) return;
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("b", encodeGarageBuild(buildA));
    if (compareOn) qs.set("b2", encodeGarageBuild(buildB));
    else qs.delete("b2");
    const next = `${pathname}?${qs.toString()}`;
    const t = window.setTimeout(() => {
      router.replace(next, { scroll: false });
    }, 240);
    return () => window.clearTimeout(t);
  }, [buildA, buildB, compareOn, pathname, router, searchParams, initialized]);

  const assemblyA = useMemo(
    () => assemblyFromGarageIds(buildA, byId),
    [buildA, byId],
  );
  const assemblyB = useMemo(
    () => assemblyFromGarageIds(buildB, byId),
    [buildB, byId],
  );

  const analysisA = useMemo((): BuildAnalysis | null => {
    if (!assemblyA) return null;
    try {
      return analyzeBuild(assemblyA);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [assemblyA]);

  const analysisB = useMemo((): BuildAnalysis | null => {
    if (!assemblyB || !compareOn) return null;
    try {
      return analyzeBuild(assemblyB);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [assemblyB, compareOn]);

  const m4A = useMemo(
    () =>
      analysisA
        ? computeFullAccuracy(analysisA, { distanceM: engagementM })
        : null,
    [analysisA, engagementM],
  );
  const m4B = useMemo(
    () =>
      analysisB && compareOn
        ? computeFullAccuracy(analysisB, { distanceM: engagementM })
        : null,
    [analysisB, compareOn, engagementM],
  );
  const battlePreview = useMemo(() => {
    if (!analysisA || !analysisB || !compareOn) return null;
    return simulateBattle(
      {
        ap: analysisA.totalAp,
        dps: analysisA.dps,
        impactPerSecond: analysisA.impactPerSecond,
        stability: analysisA.totalStability,
      },
      {
        ap: analysisB.totalAp,
        dps: analysisB.dps,
        impactPerSecond: analysisB.impactPerSecond,
        stability: analysisB.totalStability,
      },
    );
  }, [analysisA, analysisB, compareOn]);
  const optimizerPreview = useMemo(() => {
    if (!analysisA || !analysisB || !compareOn) return null;
    return optimizeAdvanced(
      { goal: "balanced", limit: 2 },
      [
        {
          build: "A",
          metrics: {
            dps: analysisA.dps,
            stagger: analysisA.impactPerSecond,
            mobility: analysisA.groundedBoostSpeed,
          },
        },
        {
          build: "B",
          metrics: {
            dps: analysisB.dps,
            stagger: analysisB.impactPerSecond,
            mobility: analysisB.groundedBoostSpeed,
          },
        },
      ],
    );
  }, [analysisA, analysisB, compareOn]);
  const counterPreview = useMemo(() => {
    if (!analysisA || !analysisB || !compareOn) return null;
    return generateCounterBuilds(
      {
        totalAp: analysisA.totalAp,
        totalStability: analysisA.totalStability,
        groundedBoostSpeed: analysisA.groundedBoostSpeed,
      },
      [
        {
          build: "B",
          dps: analysisB.dps,
          impactPerSecond: analysisB.impactPerSecond,
          mobility: analysisB.groundedBoostSpeed,
        },
      ],
      1,
    );
  }, [analysisA, analysisB, compareOn]);

  const resetDefault = useCallback(() => {
    setBuildA({ ...defaultBuild });
    setBuildB({ ...defaultBuild });
    setCompareOn(false);
  }, [defaultBuild, setBuildA, setBuildB, setCompareOn]);

  const copyLink = useCallback(() => {
    void navigator.clipboard.writeText(window.location.href);
  }, []);

  const [audioOn, setAudioOn] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastHoverRef = useRef(0);
  const [viewerMode, setViewerMode] = useState<"standard" | "3d">("standard");
  const mainTab = activeTab;
  const beep = useCallback(
    (freq: number, duration = 0.02) => {
      if (!audioOn) return;
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return;
      const ctx = audioCtxRef.current ?? new Ctx();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.022, ctx.currentTime + 0.003);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + duration,
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    [audioOn],
  );
  const playHover = useCallback(() => {
    const now = Date.now();
    if (now - lastHoverRef.current < 45) return;
    lastHoverRef.current = now;
    beep(360, 0.015);
  }, [beep]);
  const playClick = useCallback(() => beep(620, 0.03), [beep]);
  const tabCls = (on: boolean) =>
    `classic-tab ${on ? "classic-tab-active" : ""} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60`;
  const utilityTabCls =
    "classic-tab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60";

  return (
    <>
      <a
        href="#garage-main"
        className="skip-link"
      >
        Skip to garage analysis
      </a>
      <GarageShell
        title="Garage"
        subtitle={
          <>
            CLASSIC-STYLE GARAGE BASELINE. Builds sync to URL params{" "}
            <code className="rounded border border-cyan-300/40 bg-cyan-900/20 px-1">b</code>{" "}
            and{" "}
            <code className="rounded border border-cyan-300/40 bg-cyan-900/20 px-1">b2</code>.
          </>
        }
        actions={
          <>
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                setActiveTab("build");
              }}
              className={tabCls(mainTab === "build")}
            >
              Assembly
            </button>
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                setActiveTab("counters");
              }}
              className={tabCls(mainTab === "counters")}
            >
              Counters
            </button>
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                setActiveTab("viewer");
              }}
              className={tabCls(mainTab === "viewer")}
            >
              AC Viewer
            </button>
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                setActiveTab("systems");
              }}
              className={tabCls(mainTab === "systems")}
            >
              Systems
            </button>
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                setActiveTab("parts");
              }}
              className={tabCls(mainTab === "parts")}
            >
              Parts
            </button>
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                setCompareOn(!compareOn);
              }}
              className={utilityTabCls}
            >
              {compareOn ? "Hide Compare" : "Compare Build"}
            </button>
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                copyLink();
              }}
              className={utilityTabCls}
            >
              Copy Link
            </button>
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                resetDefault();
              }}
              className={utilityTabCls}
            >
              Reset
            </button>
            <Link
              href="/garage/classic"
              onMouseEnter={playHover}
              onClick={playClick}
              className={utilityTabCls}
            >
              Classic UI
            </Link>
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                setAudioOn((v) => !v);
              }}
              className={utilityTabCls}
            >
              Audio {audioOn ? "On" : "Off"}
            </button>
          </>
        }
        layout={mainTab === "build" ? "three" : "one"}
        oneColumn={
          mainTab === "parts" ? (
            <PartsTablePanel parts={parts} />
          ) : mainTab === "counters" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onMouseEnter={playHover}
                  onClick={() => {
                    playClick();
                    setCounterTab("ricochet");
                  }}
                  className={`rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                    counterTab === "ricochet"
                      ? "bg-cyan-300 text-cyan-950"
                      : "border border-cyan-300/45 bg-cyan-900/20 text-cyan-100 hover:bg-cyan-800/35"
                  }`}
                >
                  RICOCHET
                </button>
                <button
                  type="button"
                  onMouseEnter={playHover}
                  onClick={() => {
                    playClick();
                    setCounterTab("ttk");
                  }}
                  className={`rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                    counterTab === "ttk"
                      ? "bg-cyan-300 text-cyan-950"
                      : "border border-cyan-300/45 bg-cyan-900/20 text-cyan-100 hover:bg-cyan-800/35"
                  }`}
                >
                  MATCHUP TTK
                </button>
                <button
                  type="button"
                  onMouseEnter={playHover}
                  onClick={() => {
                    playClick();
                    setCounterTab("stagger");
                  }}
                  className={`rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                    counterTab === "stagger"
                      ? "bg-cyan-300 text-cyan-950"
                      : "border border-cyan-300/45 bg-cyan-900/20 text-cyan-100 hover:bg-cyan-800/35"
                  }`}
                >
                  STAGGER BREAKPOINTS
                </button>
              </div>
              {counterTab === "ricochet" ? (
                <CounterRicochetPanel parts={parts} />
              ) : null}
              {counterTab === "ttk" ? (
                <CounterMatchupTTKPanel
                  analysisA={analysisA}
                  analysisB={analysisB}
                />
              ) : null}
              {counterTab === "stagger" ? (
                <CounterStaggerBreakpointsPanel
                  analysisA={analysisA}
                  analysisB={analysisB}
                />
              ) : null}
            </div>
          ) : mainTab === "systems" ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">
                New Systems
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded border border-cyan-300/35 bg-cyan-950/20 p-3 text-xs text-cyan-100/90">
                  <p className="font-semibold uppercase tracking-wide">Battle Sim</p>
                  <p className="mt-1 font-mono">
                    Winner: {battlePreview?.winner ?? "—"} | Time: {battlePreview ? `${formatNumber(battlePreview.durationSec)}s` : "—"}
                  </p>
                </div>
                <div className="rounded border border-cyan-300/35 bg-cyan-950/20 p-3 text-xs text-cyan-100/90">
                  <p className="font-semibold uppercase tracking-wide">Optimizer</p>
                  <p className="mt-1 font-mono">
                    Top Build: {optimizerPreview?.ranked[0]?.build ?? "—"} | Count: {optimizerPreview?.count ?? 0}
                  </p>
                </div>
                <div className="rounded border border-cyan-300/35 bg-cyan-950/20 p-3 text-xs text-cyan-100/90">
                  <p className="font-semibold uppercase tracking-wide">Counters</p>
                  <p className="mt-1 font-mono">
                    Ranked: {counterPreview?.count ?? 0} | Source: Compare Pair
                  </p>
                </div>
              </div>
            </div>
          ) : mainTab === "viewer" ? (
            <MechViewerCanvas
              partsById={byId}
              build={buildA}
            />
          ) : null
        }
        left={
          <GarageLeftPanel>
            {mainTab === "build" ? (
              <div className={`grid gap-4 ${compareOn ? "md:grid-cols-2 xl:grid-cols-1" : "grid-cols-1"}`}>
                <GarageSlotColumn
                  label="Build A"
                  idPrefix="build-a"
                  ids={buildA}
                  setIds={setBuildA}
                  optionsBySlot={optionsBySlot}
                  expansionOptions={expansionOptions}
                  onHover={playHover}
                  onInteract={playClick}
                />
                {compareOn ? (
                  <GarageSlotColumn
                    label="Build B"
                    idPrefix="build-b"
                    ids={buildB}
                    setIds={setBuildB}
                    optionsBySlot={optionsBySlot}
                    expansionOptions={expansionOptions}
                    onHover={playHover}
                    onInteract={playClick}
                  />
                ) : null}
              </div>
            ) : mainTab === "parts" ? (
              <p className="rounded border border-cyan-300/30 bg-cyan-950/15 px-3 py-2 text-xs text-cyan-100/75">
                PARTS tab mirrors the classic TABLES workflow with filterable, sortable part data.
              </p>
            ) : mainTab === "counters" ? (
              <p className="rounded border border-cyan-300/30 bg-cyan-950/15 px-3 py-2 text-xs text-cyan-100/75">
                COUNTERS is now a hierarchical section. Start with RICOCHET parity and expand with matchup tools next.
              </p>
            ) : mainTab === "systems" ? (
              <p className="rounded border border-cyan-300/30 bg-cyan-950/15 px-3 py-2 text-xs text-cyan-100/75">
                SYSTEMS centralizes advanced features (battle simulation, optimizer, and counter ranking) in the same classic shell.
              </p>
            ) : (
              <p className="rounded border border-cyan-300/30 bg-cyan-950/15 px-3 py-2 text-xs text-cyan-100/75">
                AC VIEWER (STANDARD + 3D) is now the center-pane baseline for build iteration.
              </p>
            )}
          </GarageLeftPanel>
        }
        center={
          <GarageCenterPanel>
            <>
            {mainTab !== "build" ? (
              <p className="rounded border border-cyan-300/35 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-100/80">
                Use top navigation to switch Build, Parts, Counters, and Viewer workflows.
              </p>
            ) : null}
            {mainTab === "build" ? (
              <>
            <div className="rounded border border-cyan-300/35 bg-cyan-950/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold tracking-wide text-cyan-100">AC VIEWER</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onMouseEnter={playHover}
                    onClick={() => {
                      playClick();
                      setViewerMode("standard");
                    }}
                    className={`rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      viewerMode === "standard"
                        ? "bg-cyan-300 text-cyan-950"
                        : "border border-cyan-300/45 bg-cyan-900/20 text-cyan-100"
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onMouseEnter={playHover}
                    onClick={() => {
                      playClick();
                      setViewerMode("3d");
                    }}
                    className={`rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      viewerMode === "3d"
                        ? "bg-cyan-300 text-cyan-950"
                        : "border border-cyan-300/45 bg-cyan-900/20 text-cyan-100"
                    }`}
                  >
                    3D
                  </button>
                </div>
              </div>
              {viewerMode === "standard" ? (
                <StandardAcViewer
                  build={buildA}
                  partsById={byId}
                />
              ) : (
                <MechViewerCanvas
                  partsById={byId}
                  build={buildA}
                />
              )}
            </div>
            {!assemblyA && (
              <p className="rounded border border-amber-300/45 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
                Invalid build A (missing part ID).
              </p>
            )}

            {assemblyA && !analysisA && (
              <p className="rounded border border-red-300/45 bg-red-950/30 px-3 py-2 text-sm text-red-200">
                Analysis failed for build A.
              </p>
            )}

            {m4A ? (
              <div className="rounded border border-cyan-300/35 bg-cyan-950/20 p-4">
                <h3 className="text-sm font-semibold tracking-wide text-cyan-100">Engagement Sim</h3>
                <p className="mt-1 text-xs text-cyan-200/70">Single-distance preview for both builds.</p>
                <label className="mt-3 block text-sm">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-cyan-200/80">
                    Engagement distance ({engagementM} m)
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={320}
                    value={engagementM}
                    onChange={(e) => setEngagementM(Number(e.target.value))}
                    className="w-full accent-cyan-300"
                  />
                </label>
                <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-[11px] text-cyan-200/70">Build A — FCS assist</dt>
                    <dd className="font-mono text-sm">{formatNumber(m4A.fcsAssist)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-cyan-200/70">Build A — eff. DPS</dt>
                    <dd className="font-mono text-sm">{formatNumber(m4A.effectiveDpsEstimate)}</dd>
                  </div>
                  {m4B ? (
                    <>
                      <div>
                        <dt className="text-[11px] text-cyan-200/70">Build B — FCS assist</dt>
                        <dd className="font-mono text-sm">{formatNumber(m4B.fcsAssist)}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-cyan-200/70">Build B — eff. DPS</dt>
                        <dd className="font-mono text-sm">{formatNumber(m4B.effectiveDpsEstimate)}</dd>
                      </div>
                    </>
                  ) : null}
                </dl>
              </div>
            ) : null}
            {compareOn ? (
              <GarageBuildDiffPreview
                buildA={buildA}
                buildB={buildB}
                byId={byId}
              />
            ) : null}
            {battlePreview ? (
              <div className="rounded border border-cyan-300/35 bg-cyan-950/20 p-3 text-xs text-cyan-100/90">
                <p className="font-semibold uppercase tracking-wide text-cyan-100">
                  System Preview
                </p>
                <p className="mt-1">
                  Battle sim winner:{" "}
                  <span className="font-mono">{battlePreview.winner ?? "Draw"}</span>{" "}
                  in{" "}
                  <span className="font-mono">
                    {formatNumber(battlePreview.durationSec)}s
                  </span>
                </p>
                <p className="mt-1">
                  Optimizer top build:{" "}
                  <span className="font-mono">
                    {optimizerPreview?.ranked[0]?.build ?? "-"}
                  </span>
                </p>
                <p className="mt-1">
                  Counter candidate count:{" "}
                  <span className="font-mono">{counterPreview?.count ?? 0}</span>
                </p>
              </div>
            ) : null}

            {analysisA ? (
              <div className={`grid gap-4 ${compareOn && analysisB ? "2xl:grid-cols-2" : "grid-cols-1"}`}>
                <div className="rounded border border-cyan-300/35 bg-cyan-950/20 p-4">
                  <GarageAnalysisBlock
                    title="Build A"
                    analysis={analysisA}
                    compareAnalysis={compareOn ? analysisB : null}
                  />
                </div>
                {compareOn && analysisB ? (
                  <div className="rounded border border-cyan-300/35 bg-cyan-950/20 p-4">
                    <GarageAnalysisBlock
                      title="Build B"
                      analysis={analysisB}
                      compareAnalysis={analysisA}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
              </>
            ) : null}
            </>
          </GarageCenterPanel>
        }
        right={
          <GarageRightPanel>
            {mainTab === "parts" ? (
              <p className="rounded border border-cyan-300/35 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-100/85">
                More TABLES parity (column drag/filter presets) can be layered into PARTS next.
              </p>
            ) : mainTab === "counters" ? (
              <p className="rounded border border-cyan-300/35 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-100/85">
                Next COUNTERS subtabs can include stagger breakpoints, TTK, and matchup export.
              </p>
            ) : mainTab === "viewer" ? (
              <p className="rounded border border-cyan-300/35 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-100/85">
                Viewer controls: drag to rotate. This phase uses live slot geometry and color coding from selected parts.
              </p>
            ) : mainTab === "systems" ? (
              <p className="rounded border border-cyan-300/35 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-100/85">
                SYSTEMS tab is the reserved extension surface for upcoming optimizer pipelines and simulation workflows.
              </p>
            ) : analysisA ? (
              <div className="space-y-4">
                <GarageLegacyStatGroupsSection
                  analysis={analysisA}
                  title="AC SPECS (BUILD A)"
                />
                {compareOn && analysisB ? (
                  <GarageLegacyStatGroupsSection
                    analysis={analysisB}
                    title="AC SPECS (BUILD B)"
                  />
                ) : null}
              </div>
            ) : (
              <p className="rounded border border-cyan-300/35 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-100/80">
                Select a valid assembly to view detailed stat groups.
              </p>
            )}
          </GarageRightPanel>
        }
      />
    </>
  );
}
