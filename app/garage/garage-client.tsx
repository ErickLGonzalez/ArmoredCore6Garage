"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CounterRicochetPanel } from "@/components/garage/CounterRicochetPanel";
import { CounterMatchupTTKPanel } from "@/components/garage/CounterMatchupTTKPanel";
import { CounterStaggerBreakpointsPanel } from "@/components/garage/CounterStaggerBreakpointsPanel";
import { WeaponsTestTab } from "@/components/garage/weapons-test/WeaponsTestTab";
import {
  GarageAnalysisBlock,
  GarageBuildDiffPreview,
  GarageLegacyStatGroupsSection,
  GarageSlotColumn,
  MOA_GARAGE_SPECS_MODIFIED_SESSION_KEY,
} from "@/components/garage/GarageBuildPanels";
import { MechViewerCanvas } from "@/components/garage/MechViewerCanvas";
import { GarageCenterPanel } from "@/components/garage/layout/GarageCenterPanel";
import { GarageLeftPanel } from "@/components/garage/layout/GarageLeftPanel";
import { GarageRightPanel } from "@/components/garage/layout/GarageRightPanel";
import { GarageShell } from "@/components/garage/layout/GarageShell";
import { PartThumbnail } from "@/components/garage/PartThumbnail";
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
import { pickActiveBuildAnalysis } from "@/lib/garage/pick-active-build-analysis";
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
    previewPartId,
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

  const previewPart = useMemo(
    () => (previewPartId != null ? byId.get(previewPartId) ?? null : null),
    [byId, previewPartId],
  );

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

  const analysisAModified = useMemo((): BuildAnalysis | null => {
    if (!assemblyA) return null;
    try {
      return analyzeBuild(assemblyA, { modifiedUnitStats: true });
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [assemblyA]);

  const analysisBModified = useMemo((): BuildAnalysis | null => {
    if (!assemblyB || !compareOn) return null;
    try {
      return analyzeBuild(assemblyB, { modifiedUnitStats: true });
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [assemblyB, compareOn]);

  const [showModifiedUnitSpecs, setShowModifiedUnitSpecs] = useState(false);

  useEffect(() => {
    try {
      setShowModifiedUnitSpecs(
        sessionStorage.getItem(MOA_GARAGE_SPECS_MODIFIED_SESSION_KEY) === "1",
      );
    } catch {
      /* private mode */
    }
  }, []);

  const setShowModifiedUnitSpecsPersist = useCallback((on: boolean) => {
    setShowModifiedUnitSpecs(on);
    try {
      sessionStorage.setItem(
        MOA_GARAGE_SPECS_MODIFIED_SESSION_KEY,
        on ? "1" : "0",
      );
    } catch {
      /* ignore */
    }
  }, []);

  const analysisAActive = useMemo(
    () =>
      pickActiveBuildAnalysis(
        analysisA,
        analysisAModified,
        showModifiedUnitSpecs,
      ),
    [analysisA, analysisAModified, showModifiedUnitSpecs],
  );

  const analysisBActive = useMemo(
    () =>
      pickActiveBuildAnalysis(
        analysisB,
        analysisBModified,
        showModifiedUnitSpecs,
      ),
    [analysisB, analysisBModified, showModifiedUnitSpecs],
  );

  const m4A = useMemo(
    () =>
      analysisAActive
        ? computeFullAccuracy(analysisAActive, { distanceM: engagementM })
        : null,
    [analysisAActive, engagementM],
  );
  const m4B = useMemo(
    () =>
      analysisBActive && compareOn
        ? computeFullAccuracy(analysisBActive, { distanceM: engagementM })
        : null,
    [analysisBActive, compareOn, engagementM],
  );
  const battlePreview = useMemo(() => {
    if (!analysisAActive || !analysisBActive || !compareOn) return null;
    return simulateBattle(
      {
        ap: analysisAActive.totalAp,
        dps: analysisAActive.dps,
        impactPerSecond: analysisAActive.impactPerSecond,
        stability: analysisAActive.totalStability,
      },
      {
        ap: analysisBActive.totalAp,
        dps: analysisBActive.dps,
        impactPerSecond: analysisBActive.impactPerSecond,
        stability: analysisBActive.totalStability,
      },
    );
  }, [analysisAActive, analysisBActive, compareOn]);
  const optimizerPreview = useMemo(() => {
    if (!analysisAActive || !analysisBActive || !compareOn) return null;
    return optimizeAdvanced(
      { goal: "balanced", limit: 2 },
      [
        {
          build: "A",
          metrics: {
            dps: analysisAActive.dps,
            stagger: analysisAActive.impactPerSecond,
            mobility: analysisAActive.groundedBoostSpeed,
          },
        },
        {
          build: "B",
          metrics: {
            dps: analysisBActive.dps,
            stagger: analysisBActive.impactPerSecond,
            mobility: analysisBActive.groundedBoostSpeed,
          },
        },
      ],
    );
  }, [analysisAActive, analysisBActive, compareOn]);
  const counterPreview = useMemo(() => {
    if (!analysisAActive || !analysisBActive || !compareOn) return null;
    return generateCounterBuilds(
      {
        totalAp: analysisAActive.totalAp,
        totalStability: analysisAActive.totalStability,
        groundedBoostSpeed: analysisAActive.groundedBoostSpeed,
      },
      [
        {
          build: "B",
          dps: analysisBActive.dps,
          impactPerSecond: analysisBActive.impactPerSecond,
          mobility: analysisBActive.groundedBoostSpeed,
        },
      ],
      1,
    );
  }, [analysisAActive, analysisBActive, compareOn]);

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
    `classic-tab ${on ? "classic-tab-active" : ""} focus-visible:outline-none`;
  const utilityTabCls =
    "classic-tab focus-visible:outline-none";
  const utilityMiniCls = `${utilityTabCls} text-[9px]`;

  return (
    <>
      <a
        href="#garage-main"
        className="skip-link"
      >
        SKIP TO GARAGE ANALYSIS
      </a>
      <GarageShell
        title="GARAGE"
        subtitle={<>AC VI BUILD LAB // STATS, PARTS, AND ASSEMBLY TOOLS</>}
        actions={
          <>
            <div className="ac6-header-tab-row">
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                setActiveTab("build");
              }}
              className={tabCls(mainTab === "build")}
            >
              ASSEMBLY
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
              PARTS
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
              COUNTERS
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
              AC VIEWER
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
              SYSTEMS
            </button>
            </div>
            <div className="ac6-header-util-row">
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                setCompareOn(!compareOn);
              }}
              className={utilityMiniCls}
            >
              {compareOn ? "COMPARE: ON" : "COMPARE: OFF"}
            </button>
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                copyLink();
              }}
              className={utilityMiniCls}
            >
              COPY URL
            </button>
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                resetDefault();
              }}
              className={utilityMiniCls}
            >
              RESET AC
            </button>
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                setAudioOn((v) => !v);
              }}
              className={utilityMiniCls}
            >
              AUDIO {audioOn ? "ON" : "OFF"}
            </button>
            </div>
          </>
        }
        layout={mainTab === "build" ? "three" : "one"}
        oneColumn={
          mainTab === "parts" ? (
            <PartsTablePanel parts={parts} />
          ) : mainTab === "counters" ? (
            <div className="space-y-2">
              <div className="ac6-header-tab-row">
                <button
                  type="button"
                  onMouseEnter={playHover}
                  onClick={() => {
                    playClick();
                    setCounterTab("ricochet");
                  }}
                  className={tabCls(counterTab === "ricochet")}
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
                  className={tabCls(counterTab === "ttk")}
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
                  className={tabCls(counterTab === "stagger")}
                >
                  STAGGER BREAKPOINTS
                </button>
                <button
                  type="button"
                  onMouseEnter={playHover}
                  onClick={() => {
                    playClick();
                    setCounterTab("weaponsTest");
                  }}
                  className={tabCls(counterTab === "weaponsTest")}
                >
                  WEAPONS TEST
                </button>
              </div>
              {counterTab === "ricochet" ? (
                <CounterRicochetPanel parts={parts} />
              ) : null}
              {counterTab === "ttk" ? (
                <CounterMatchupTTKPanel
                  analysisA={analysisAActive}
                  analysisB={analysisBActive}
                />
              ) : null}
              {counterTab === "stagger" ? (
                <CounterStaggerBreakpointsPanel
                  analysisA={analysisAActive}
                  analysisB={analysisBActive}
                />
              ) : null}
              {counterTab === "weaponsTest" ? (
                <WeaponsTestTab
                  assembly={assemblyA}
                  analysis={analysisAActive}
                  compareOn={compareOn}
                  compareAssembly={compareOn ? assemblyB : null}
                  compareAnalysis={compareOn ? analysisBActive : null}
                />
              ) : null}
            </div>
          ) : mainTab === "systems" ? (
            <div className="space-y-2">
              <h3 className="ac6-block-title">
                SYSTEMS
              </h3>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="ac6-block text-[11px] text-cyan-100/90">
                  <p className="ac6-system-card-title">BATTLE SIM</p>
                  <p className="mt-0.5 font-mono">
                    WINNER: {battlePreview?.winner ?? "—"} | TIME: {battlePreview ? `${formatNumber(battlePreview.durationSec)}S` : "—"}
                  </p>
                </div>
                <div className="ac6-block text-[11px] text-cyan-100/90">
                  <p className="ac6-system-card-title">OPTIMIZER</p>
                  <p className="mt-0.5 font-mono">
                    TOP AC SET: {optimizerPreview?.ranked[0]?.build ?? "—"} | COUNT: {optimizerPreview?.count ?? 0}
                  </p>
                </div>
                <div className="ac6-block text-[11px] text-cyan-100/90">
                  <p className="ac6-system-card-title">COUNTERS</p>
                  <p className="mt-0.5 font-mono">
                    RANKED: {counterPreview?.count ?? 0} | SOURCE: COMPARE PAIR
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
              <div
                className={`ac6-inner-frame ac6-inner-frame--assembly min-w-0 grid gap-2 ${compareOn ? "md:grid-cols-2 xl:grid-cols-1" : "grid-cols-1"}`}
              >
                <GarageSlotColumn
                  label="AC SET A"
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
                    label="AC SET B"
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
              <div className="ac6-stack">
                <div className="ac6-strip">
                  <p className="ac6-block-title leading-none">PART DATABASE</p>
                </div>
                <p className="ac6-note">
                  SLOT FILTER, COLUMN GROUPS, AND SORT ORDER MATCH THE CLASSIC PARTS
                  WORKFLOW. USE THE CENTER PANEL FOR THE FULL TABLE.
                </p>
                {previewPart ? (
                  <div className="ac6-block p-2">
                    <div className="ac6-strip mb-1.5">
                      <p className="ac6-chart-section-title m-0">ROW PREVIEW</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <PartThumbnail
                        partName={previewPart.identity.name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase leading-tight tracking-[0.05em] text-cyan-100">
                          {previewPart.identity.name}
                        </p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-cyan-200/75">
                          {previewPart.identity.kind}
                          {previewPart.identity.manufacturer
                            ? ` · ${previewPart.identity.manufacturer}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="ac6-note">HOVER THE PART TABLE TO PREVIEW ICON AND IDENTITY HERE.</p>
                )}
              </div>
            ) : mainTab === "counters" ? (
              <p className="ac6-note">
                COUNTERS INCLUDES RICOCHET, MATCHUP TTK, STAGGER BREAKPOINTS, AND
                WEAPONS TEST.
              </p>
            ) : mainTab === "systems" ? (
              <p className="ac6-note">
                SYSTEMS HOSTS BATTLE SIM, OPTIMIZER, AND COUNTER RANKING.
              </p>
            ) : (
              <p className="ac6-note">
                AC VIEWER SUPPORTS STANDARD AND 3D MODES.
              </p>
            )}
          </GarageLeftPanel>
        }
        center={
          <GarageCenterPanel>
            <div className="ac6-stack">
            {mainTab !== "build" ? (
              <p className="ac6-note">USE TOP TABS TO SWITCH ASSEMBLY, PARTS, COUNTERS, VIEWER, AND SYSTEMS.</p>
            ) : null}
            {mainTab === "build" ? (
              <>
            <div className="ac6-block">
              <div className="ac6-strip mb-1 flex items-center justify-between">
                <h3 className="ac6-block-title leading-none">AC VIEWER</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onMouseEnter={playHover}
                    onClick={() => {
                      playClick();
                      setViewerMode("standard");
                    }}
                    className={tabCls(viewerMode === "standard")}
                  >
                    STANDARD
                  </button>
                  <button
                    type="button"
                    onMouseEnter={playHover}
                    onClick={() => {
                      playClick();
                      setViewerMode("3d");
                    }}
                    className={tabCls(viewerMode === "3d")}
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
              <p className="ac6-alert">
                INVALID AC SET A (MISSING PART ID).
              </p>
            )}

            {assemblyA && !analysisA && (
              <p className="ac6-alert">
                ANALYSIS FAILED FOR AC SET A.
              </p>
            )}

            {m4A ? (
              <div className="ac6-block p-2">
                <div className="ac6-strip mb-1">
                  <h3 className="ac6-block-title leading-none">ENGAGEMENT SIM</h3>
                </div>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.05em] text-cyan-200/70">
                  SINGLE-DISTANCE PREVIEW FOR AC SET A/B.
                </p>
                <label className="mt-1.5 block text-[11px]">
                  <span className="ac6-chart-section-title mb-1 block">
                    ENGAGEMENT DISTANCE ({engagementM} M)
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
                <dl className="ac6-stat-grid mt-1.5 grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-cyan-200/70">AC SET A — FCS ASSIST</dt>
                    <dd className="font-mono font-medium text-cyan-50">{formatNumber(m4A.fcsAssist)}</dd>
                  </div>
                  <div>
                    <dt className="text-cyan-200/70">AC SET A — EFF DPS</dt>
                    <dd className="font-mono font-medium text-cyan-50">{formatNumber(m4A.effectiveDpsEstimate)}</dd>
                  </div>
                  {m4B ? (
                    <>
                      <div>
                        <dt className="text-cyan-200/70">AC SET B — FCS ASSIST</dt>
                        <dd className="font-mono font-medium text-cyan-50">{formatNumber(m4B.fcsAssist)}</dd>
                      </div>
                      <div>
                        <dt className="text-cyan-200/70">AC SET B — EFF DPS</dt>
                        <dd className="font-mono font-medium text-cyan-50">{formatNumber(m4B.effectiveDpsEstimate)}</dd>
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
              <div className="ac6-block text-xs text-cyan-100/90">
                <div className="ac6-strip mb-1">
                  <p className="font-semibold uppercase tracking-wide text-cyan-100">
                    SYSTEM PREVIEW
                  </p>
                </div>
                <p className="mt-0.5">
                  BATTLE SIM WINNER:{" "}
                  <span className="font-mono">{battlePreview.winner ?? "DRAW"}</span>{" "}
                  IN{" "}
                  <span className="font-mono">
                    {formatNumber(battlePreview.durationSec)}S
                  </span>
                </p>
                <p className="mt-0.5">
                  OPTIMIZER TOP AC SET:{" "}
                  <span className="font-mono">
                    {optimizerPreview?.ranked[0]?.build ?? "-"}
                  </span>
                </p>
                <p className="mt-0.5">
                  COUNTER CANDIDATE COUNT:{" "}
                  <span className="font-mono">{counterPreview?.count ?? 0}</span>
                </p>
              </div>
            ) : null}

            {analysisA ? (
              <div className={`grid gap-2 ${compareOn && analysisB ? "2xl:grid-cols-2" : "grid-cols-1"}`}>
                <div className="ac6-block p-2">
                  <GarageAnalysisBlock
                    title="AC SET A"
                    analysis={analysisAActive!}
                    compareAnalysis={
                      compareOn && analysisBActive ? analysisBActive : null
                    }
                  />
                </div>
                {compareOn && analysisB ? (
                  <div className="ac6-block p-2">
                    <GarageAnalysisBlock
                      title="AC SET B"
                      analysis={analysisBActive!}
                      compareAnalysis={analysisAActive}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
              </>
            ) : null}
            </div>
          </GarageCenterPanel>
        }
        right={
          <GarageRightPanel>
            {mainTab === "parts" ? (
              <div className="ac6-stack">
                <div className="ac6-strip">
                  <p className="ac6-block-title leading-none">PART DATABASE</p>
                </div>
                <p className="ac6-note">
                  COLUMN GROUP ROWS, STICKY NAME, AND PER-COLUMN FILTERS FOLLOW THE
                  CLASSIC PARTS TABLE LAYOUT.
                </p>
                {previewPart ? (
                  <div className="ac6-block p-2">
                    <div className="ac6-strip mb-1.5">
                      <p className="ac6-chart-section-title m-0">SELECTED ROW</p>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <PartThumbnail
                        partName={previewPart.identity.name}
                        size="md"
                      />
                      <p className="w-full text-center text-[10px] font-semibold uppercase leading-tight text-cyan-100">
                        {previewPart.identity.name}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : mainTab === "counters" ? (
              <p className="ac6-note">
                COUNTERS PROVIDES MATCHUP AND BREAKPOINT ANALYSIS VIEWS.
              </p>
            ) : mainTab === "viewer" ? (
              <p className="ac6-note">
                DRAG TO ROTATE THE AC MODEL; SLOT ASSEMBLY UPDATES FROM SELECTED PARTS.
              </p>
            ) : mainTab === "systems" ? (
              <p className="ac6-note">
                SYSTEMS IS THE EXTENSION SURFACE FOR ADVANCED SIMULATION WORKFLOWS.
              </p>
            ) : analysisA ? (
              <GarageLegacyStatGroupsSection
                analysis={analysisA}
                analysisModified={analysisAModified}
                compareAnalysis={compareOn && analysisB ? analysisB : null}
                compareAnalysisModified={
                  compareOn && analysisBModified ? analysisBModified : null
                }
                modifiedUnitSpecs={showModifiedUnitSpecs}
                onModifiedUnitSpecsChange={setShowModifiedUnitSpecsPersist}
                title={
                  compareOn && analysisB ? "AC SPECS · A VS B" : "AC SPECS (BUILD A)"
                }
              />
            ) : (
              <p className="ac6-note">SELECT A VALID ASSEMBLY TO VIEW DETAILED STAT GROUPS.</p>
            )}
          </GarageRightPanel>
        }
      />
    </>
  );
}
