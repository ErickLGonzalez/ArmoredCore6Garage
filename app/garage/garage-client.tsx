"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AimAssistPlot } from "@/components/garage/AimAssistPlot";
import { EnergyRecoveryPlot } from "@/components/garage/EnergyRecoveryPlot";
import { GarageCenterPanel } from "@/components/garage/layout/GarageCenterPanel";
import { GarageLeftPanel } from "@/components/garage/layout/GarageLeftPanel";
import { GarageRightPanel } from "@/components/garage/layout/GarageRightPanel";
import { GarageShell } from "@/components/garage/layout/GarageShell";
import { RecoilPlot } from "@/components/garage/RecoilPlot";
import {
  REQUIRED_ASSEMBLY_SLOTS,
  analyzeBuild,
  computeFullAccuracy,
  type BuildAnalysis,
} from "@/lib/calc";
import type { LegacyStatRow } from "@/lib/calc/types";
import { assemblyFromGarageIds } from "@/lib/garage/assembly-from-ids";
import { decodeGarageBuild, encodeGarageBuild } from "@/lib/garage/build-url";
import type { GarageBuildIds } from "@/lib/garage/default-assembly";
import {
  getAimAssistPlotData,
  getEnergyRecoveryCurves,
  getRecoilPlotPoints,
} from "@/lib/garage/plot-data";
import {
  EXPANSION_SLOT_LABEL,
  partsForSlot,
  SLOT_LABELS,
  sortPartsByName,
  type RequiredSlot,
} from "@/lib/garage/slot-options";
import type { CanonicalPart } from "@/lib/schema";
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

function formatStatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number" && Number.isFinite(v)) return formatNumber(v);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function skipCollapsibleRow(row: LegacyStatRow): boolean {
  return (
    row.type === "RangePlot" ||
    row.type === "RecoilPlot" ||
    row.type === "EnergyPlot"
  );
}

const SUMMARY_METRICS: { key: keyof BuildAnalysis; label: string }[] = [
  { key: "totalWeight", label: "Total weight" },
  { key: "totalEnLoad", label: "Total EN load" },
  { key: "totalAp", label: "AP" },
  { key: "totalDef", label: "Mean frame DEF" },
  { key: "totalStability", label: "Attitude stability" },
  { key: "groundedBoostSpeed", label: "Grounded boost speed" },
  { key: "qbReload", label: "QB reload time" },
  { key: "enSupplyEfficiency", label: "EN supply efficiency" },
  { key: "dps", label: "Σ Damage/s (all units)" },
  { key: "burstDps", label: "Σ burst DPS (incl. reload)" },
  { key: "impactPerSecond", label: "Σ Impact/s" },
  { key: "accumulativeImpactPerSecond", label: "Σ Acc. impact/s" },
];

const SLOT_GROUPS: { label: string; slots: RequiredSlot[] }[] = [
  { label: "Weapons", slots: ["rightArm", "leftArm", "rightBack", "leftBack"] },
  { label: "Frame", slots: ["head", "core", "arms", "legs"] },
  { label: "Internals", slots: ["booster", "fcs", "generator"] },
];

type SlotColumnProps = {
  label: string;
  idPrefix: string;
  ids: GarageBuildIds;
  setIds: Dispatch<SetStateAction<GarageBuildIds>>;
  optionsBySlot: Map<RequiredSlot, CanonicalPart[]>;
  expansionOptions: CanonicalPart[];
  onInteract?: () => void;
  onHover?: () => void;
};

function SlotColumn({
  label,
  idPrefix,
  ids,
  setIds,
  optionsBySlot,
  expansionOptions,
  onInteract,
  onHover,
}: SlotColumnProps) {
  const setSlot = useCallback(
    (slot: RequiredSlot, id: number) => {
      setIds((prev) => ({ ...prev, [slot]: id }));
    },
    [setIds],
  );

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
        {label}
      </p>
      {SLOT_GROUPS.map((group) => (
        <div
          key={group.label}
          className="space-y-2"
        >
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/60">
            {group.label}
          </p>
          {group.slots.map((slot) => {
            const opts = optionsBySlot.get(slot) ?? [];
            const sid = `${idPrefix}-${slot}`;
            return (
              <label
                key={slot}
                htmlFor={sid}
                className="block text-sm"
              >
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-cyan-100/85">
                  {SLOT_LABELS[slot]}
                </span>
                <select
                  id={sid}
                  className="w-full rounded border border-cyan-300/40 bg-[#081724] px-2 py-1.5 text-xs text-cyan-50 outline-none focus:border-cyan-200 focus:ring-2 focus:ring-cyan-400/20"
                  value={ids[slot]}
                  onMouseEnter={onHover}
                  onChange={(e) => {
                    onInteract?.();
                    setSlot(slot, Number(e.target.value));
                  }}
                >
                  {opts.map((p) => (
                    <option
                      key={p.identity.id}
                      value={p.identity.id}
                    >
                      {p.identity.name}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      ))}
      <label
        htmlFor={`${idPrefix}-expansion`}
        className="block text-sm"
      >
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-cyan-100/85">
          {EXPANSION_SLOT_LABEL}
        </span>
        <select
          id={`${idPrefix}-expansion`}
          className="w-full rounded border border-cyan-300/40 bg-[#081724] px-2 py-1.5 text-xs text-cyan-50 outline-none focus:border-cyan-200 focus:ring-2 focus:ring-cyan-400/20"
          value={ids.expansionId}
          onMouseEnter={onHover}
          onChange={(e) => {
            onInteract?.();
            setIds((prev) => ({ ...prev, expansionId: Number(e.target.value) }));
          }}
        >
          {expansionOptions.map((p) => (
            <option
              key={p.identity.id}
              value={p.identity.id}
            >
              {p.identity.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function AnalysisBlock({
  title,
  analysis,
  compareAnalysis,
}: {
  title: string;
  analysis: BuildAnalysis;
  compareAnalysis: BuildAnalysis | null;
}) {
  const aimPrimary = getAimAssistPlotData(analysis.groups);
  const aimCompare = compareAnalysis
    ? getAimAssistPlotData(compareAnalysis.groups)
    : null;
  const recPrimary = getRecoilPlotPoints(analysis.groups);
  const recCompare = compareAnalysis
    ? getRecoilPlotPoints(compareAnalysis.groups)
    : null;
  const enPrimary = getEnergyRecoveryCurves(analysis.groups);
  const enCompare = compareAnalysis
    ? getEnergyRecoveryCurves(compareAnalysis.groups)
    : null;

  const aimOk =
    aimPrimary &&
    aimPrimary.length >= 7 &&
    [4, 5, 6].every((i) => Number.isFinite(aimPrimary[i]!));

  return (
    <div className="space-y-6 text-cyan-50">
      <h3 className="text-sm font-semibold tracking-wide text-cyan-100">
        {title}
      </h3>

      {aimOk ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cyan-200/70">
            Aim assist vs distance (legacy-style)
          </p>
          <AimAssistPlot
            className="h-44 w-full max-w-md"
            primary={aimPrimary!}
            compare={compareAnalysis ? aimCompare : null}
          />
          <p className="mt-1 text-[10px] text-cyan-200/65">
            Cyan: this build. Red verticals: unit ideal ranges (capped 300 m). Dashed:
            compare build.
          </p>
        </div>
      ) : null}

      {recPrimary && recPrimary.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cyan-200/70">
            Recoil accumulation (legacy-style)
          </p>
          <RecoilPlot
            className="h-44 w-full max-w-md"
            primary={recPrimary}
            compare={compareAnalysis ? recCompare : null}
          />
        </div>
      ) : null}

      {enPrimary ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cyan-200/70">
            EN recovery (legacy-style)
          </p>
          <EnergyRecoveryPlot
            className="h-48 w-full max-w-md"
            primary={enPrimary}
            compare={compareAnalysis ? enCompare : null}
          />
          <p className="mt-1 text-[10px] text-cyan-200/65">
            Cyan: normal recharge. Red: redline. Dashed: compare build.
          </p>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cyan-200/70">
          Summary
        </p>
        <dl className="grid gap-2 sm:grid-cols-2">
          {SUMMARY_METRICS.map(({ key, label }) => {
            const v = analysis[key];
            const display =
              typeof v === "number" ? formatNumber(v) : formatStatValue(v);
            let delta: string | null = null;
            let deltaClass = "text-cyan-200/70";
            const compareValue = compareAnalysis ? compareAnalysis[key] : null;
            if (typeof v === "number" && typeof compareValue === "number") {
              const d = v - compareValue;
              if (Number.isFinite(d) && Math.abs(d) > 1e-6) {
                delta = `${d > 0 ? "+" : ""}${formatNumber(d)}`;
                deltaClass = d > 0 ? "text-emerald-300" : "text-rose-300";
              } else {
                delta = "±0";
              }
            }
            return (
              <div key={key}>
                <dt className="text-xs text-cyan-200/70">{label}</dt>
                <dd className="font-mono text-sm font-medium text-cyan-50">
                  {display}
                  {delta ? (
                    <span className={`ml-1 text-[11px] ${deltaClass}`}>
                      ({delta})
                    </span>
                  ) : null}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
}

function LegacyStatGroupsSection({
  analysis,
  title,
}: {
  analysis: BuildAnalysis;
  title: string;
}) {
  return (
    <div className="rounded border border-cyan-300/35 bg-cyan-950/20 p-4">
      <h3 className="text-sm font-semibold tracking-wide text-cyan-100">
        {title}
      </h3>
      <p className="mt-1 text-xs text-cyan-200/70">
        Range, recoil, and EN recovery plot rows omitted (see charts above).
      </p>
      <div className="mt-4 space-y-3">
        {analysis.groups.map((group, gi) => (
          <details
            key={gi}
            className="group rounded border border-cyan-300/25"
          >
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-800/20">
              Group {gi + 1}{" "}
              <span className="font-normal text-cyan-200/70">
                ({group.filter((r) => !skipCollapsibleRow(r)).length} stats)
              </span>
            </summary>
            <div className="border-t border-cyan-300/20">
              <table className="w-full text-left text-xs">
                <tbody>
                  {group
                    .filter((row) => !skipCollapsibleRow(row))
                    .map((row) => (
                      <tr
                        key={row.name}
                        className="border-b border-cyan-300/10 last:border-0"
                      >
                        <th className="w-[40%] px-3 py-1.5 font-medium text-cyan-100">
                          {row.name}
                          {row.type ? (
                            <span className="ml-1 font-normal text-cyan-200/60">
                              ({row.type})
                            </span>
                          ) : null}
                        </th>
                        <td className="break-all px-3 py-1.5 font-mono text-cyan-50/90">
                          {formatStatValue(row.value)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
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
    setBuildA,
    setBuildB,
    setCompareOn,
    setEngagementM,
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

  const resetDefault = useCallback(() => {
    setBuildA({ ...defaultBuild });
    setBuildB({ ...defaultBuild });
    setCompareOn(false);
  }, [defaultBuild]);

  const copyLink = useCallback(() => {
    void navigator.clipboard.writeText(window.location.href);
  }, []);

  const [audioOn, setAudioOn] = useState(true);
  const beep = useCallback(
    (freq: number, duration = 0.02) => {
      if (!audioOn) return;
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.value = 0.02;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    [audioOn],
  );
  const playHover = useCallback(() => beep(360, 0.015), [beep]);
  const playClick = useCallback(() => beep(620, 0.03), [beep]);

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
            Builds sync to URL params <code className="rounded border border-cyan-300/40 bg-cyan-900/20 px-1">b</code> and{" "}
            <code className="rounded border border-cyan-300/40 bg-cyan-900/20 px-1">b2</code>. Toggle compare to overlay build B on all combat curves.
          </>
        }
        actions={
          <>
            <button
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                setCompareOn(!compareOn);
              }}
              className="rounded border border-cyan-300/45 bg-cyan-900/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-100 transition-colors hover:bg-cyan-800/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
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
              className="rounded border border-cyan-300/45 bg-cyan-900/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-100 transition-colors hover:bg-cyan-800/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
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
              className="rounded border border-cyan-300/45 bg-cyan-900/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-100 transition-colors hover:bg-cyan-800/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              Reset
            </button>
            <Link
              href="/garage/classic"
              onMouseEnter={playHover}
              onClick={playClick}
              className="rounded border border-cyan-300/45 bg-cyan-900/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-100 transition-colors hover:bg-cyan-800/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
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
              className="rounded border border-cyan-300/45 bg-cyan-900/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-100 transition-colors hover:bg-cyan-800/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              Audio {audioOn ? "On" : "Off"}
            </button>
          </>
        }
        left={
          <GarageLeftPanel>
            <div className={`grid gap-4 ${compareOn ? "md:grid-cols-2 xl:grid-cols-1" : "grid-cols-1"}`}>
              <SlotColumn
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
                <SlotColumn
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
          </GarageLeftPanel>
        }
        center={
          <GarageCenterPanel>
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

            {analysisA ? (
              <div className={`grid gap-4 ${compareOn && analysisB ? "2xl:grid-cols-2" : "grid-cols-1"}`}>
                <div className="rounded border border-cyan-300/35 bg-cyan-950/20 p-4">
                  <AnalysisBlock
                    title="Build A"
                    analysis={analysisA}
                    compareAnalysis={compareOn ? analysisB : null}
                  />
                </div>
                {compareOn && analysisB ? (
                  <div className="rounded border border-cyan-300/35 bg-cyan-950/20 p-4">
                    <AnalysisBlock
                      title="Build B"
                      analysis={analysisB}
                      compareAnalysis={analysisA}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </GarageCenterPanel>
        }
        right={
          <GarageRightPanel>
            {analysisA ? (
              <div className="space-y-4">
                <LegacyStatGroupsSection
                  analysis={analysisA}
                  title="Legacy stat groups (build A)"
                />
                {compareOn && analysisB ? (
                  <LegacyStatGroupsSection
                    analysis={analysisB}
                    title="Legacy stat groups (build B)"
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
