"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AimAssistPlot } from "@/components/garage/AimAssistPlot";
import { EnergyRecoveryPlot } from "@/components/garage/EnergyRecoveryPlot";
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

type SlotColumnProps = {
  label: string;
  idPrefix: string;
  ids: GarageBuildIds;
  setIds: Dispatch<SetStateAction<GarageBuildIds>>;
  optionsBySlot: Map<RequiredSlot, CanonicalPart[]>;
  expansionOptions: CanonicalPart[];
};

function SlotColumn({
  label,
  idPrefix,
  ids,
  setIds,
  optionsBySlot,
  expansionOptions,
}: SlotColumnProps) {
  const setSlot = useCallback(
    (slot: RequiredSlot, id: number) => {
      setIds((prev) => ({ ...prev, [slot]: id }));
    },
    [setIds],
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      {REQUIRED_ASSEMBLY_SLOTS.map((slot) => {
        const opts = optionsBySlot.get(slot) ?? [];
        const sid = `${idPrefix}-${slot}`;
        return (
          <label
            key={slot}
            htmlFor={sid}
            className="block text-sm"
          >
            <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
              {SLOT_LABELS[slot]}
            </span>
            <select
              id={sid}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
              value={ids[slot]}
              onChange={(e) => setSlot(slot, Number(e.target.value))}
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
      <label
        htmlFor={`${idPrefix}-expansion`}
        className="block text-sm"
      >
        <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
          {EXPANSION_SLOT_LABEL}
        </span>
        <select
          id={`${idPrefix}-expansion`}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
          value={ids.expansionId}
          onChange={(e) =>
            setIds((prev) => ({ ...prev, expansionId: Number(e.target.value) }))
          }
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
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>

      {aimOk ? (
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Aim assist vs distance (legacy-style)
          </p>
          <AimAssistPlot
            className="h-44 w-full max-w-md"
            primary={aimPrimary!}
            compare={compareAnalysis ? aimCompare : null}
          />
          <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            Cyan: this build. Red verticals: unit ideal ranges (capped 300 m). Dashed:
            compare build.
          </p>
        </div>
      ) : null}

      {recPrimary && recPrimary.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
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
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            EN recovery (legacy-style)
          </p>
          <EnergyRecoveryPlot
            className="h-48 w-full max-w-md"
            primary={enPrimary}
            compare={compareAnalysis ? enCompare : null}
          />
          <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            Cyan: normal recharge. Red: redline. Dashed: compare build.
          </p>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Summary
        </p>
        <dl className="grid gap-2 sm:grid-cols-2">
          {SUMMARY_METRICS.map(({ key, label }) => {
            const v = analysis[key];
            const display =
              typeof v === "number" ? formatNumber(v) : formatStatValue(v);
            return (
              <div key={key}>
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
                <dd className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {display}
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
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Range, recoil, and EN recovery plot rows omitted (see charts above).
      </p>
      <div className="mt-4 space-y-3">
        {analysis.groups.map((group, gi) => (
          <details
            key={gi}
            className="group rounded-lg border border-zinc-200 dark:border-zinc-700"
          >
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/50">
              Group {gi + 1}{" "}
              <span className="font-normal text-zinc-500">
                ({group.filter((r) => !skipCollapsibleRow(r)).length} stats)
              </span>
            </summary>
            <div className="border-t border-zinc-200 dark:border-zinc-700">
              <table className="w-full text-left text-xs">
                <tbody>
                  {group
                    .filter((row) => !skipCollapsibleRow(row))
                    .map((row) => (
                      <tr
                        key={row.name}
                        className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                      >
                        <th className="w-[40%] px-3 py-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                          {row.name}
                          {row.type ? (
                            <span className="ml-1 font-normal text-zinc-400">
                              ({row.type})
                            </span>
                          ) : null}
                        </th>
                        <td className="break-all px-3 py-1.5 font-mono text-zinc-600 dark:text-zinc-400">
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
  const [buildA, setBuildA] = useState<GarageBuildIds>(
    initialUrl.current.buildA,
  );
  const [buildB, setBuildB] = useState<GarageBuildIds>(
    initialUrl.current.buildB,
  );
  const [compareOn, setCompareOn] = useState(initialUrl.current.compareOn);
  const [engagementM, setEngagementM] = useState(180);

  useEffect(() => {
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("b", encodeGarageBuild(buildA));
    if (compareOn) qs.set("b2", encodeGarageBuild(buildB));
    else qs.delete("b2");
    const next = `${pathname}?${qs.toString()}`;
    const t = window.setTimeout(() => {
      router.replace(next, { scroll: false });
    }, 240);
    return () => window.clearTimeout(t);
  }, [buildA, buildB, compareOn, pathname, router, searchParams]);

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

  return (
    <>
      <a
        href="#garage-main"
        className="skip-link"
      >
        Skip to garage analysis
      </a>
      <main
        id="garage-main"
        className="mx-auto max-w-6xl px-6 py-10"
        tabIndex={-1}
      >
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Garage · UI v2
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-geist-sans)] text-3xl font-semibold tracking-tight">
            Garage
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Builds sync to the URL (<code className="rounded bg-zinc-200/80 px-1 dark:bg-zinc-800">b</code>,{" "}
            <code className="rounded bg-zinc-200/80 px-1 dark:bg-zinc-800">b2</code>).
            Toggle compare to overlay a second assembly on the plots.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCompareOn((v) => !v)}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 focus-visible:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500/50 dark:focus-visible:ring-offset-zinc-950"
          >
            {compareOn ? "Hide compare" : "Compare build"}
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 focus-visible:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500/50 dark:focus-visible:ring-offset-zinc-950"
          >
            Copy link
          </button>
          <button
            type="button"
            onClick={resetDefault}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 focus-visible:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500/50 dark:focus-visible:ring-offset-zinc-950"
          >
            Reset defaults
          </button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="space-y-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Assembly
          </h2>
          <div
            className={`grid gap-6 ${compareOn ? "sm:grid-cols-2" : "grid-cols-1"}`}
          >
            <SlotColumn
              label="Build A"
              idPrefix="build-a"
              ids={buildA}
              setIds={setBuildA}
              optionsBySlot={optionsBySlot}
              expansionOptions={expansionOptions}
            />
            {compareOn ? (
              <SlotColumn
                label="Build B"
                idPrefix="build-b"
                ids={buildB}
                setIds={setBuildB}
                optionsBySlot={optionsBySlot}
                expansionOptions={expansionOptions}
              />
            ) : null}
          </div>
        </section>

        <section className="min-w-0 space-y-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Analysis
          </h2>

          {!assemblyA && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              Invalid build A (missing part ID).
            </p>
          )}

          {assemblyA && !analysisA && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              Analysis failed for build A.
            </p>
          )}

          {m4A && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                M4 combat preview
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                One engagement distance for both builds. Heuristic DPS preview only.
              </p>
              <label className="mt-4 block text-sm">
                <span className="mb-2 block font-medium text-zinc-700 dark:text-zinc-300">
                  Engagement distance ({engagementM} m)
                </span>
                <input
                  type="range"
                  min={0}
                  max={320}
                  value={engagementM}
                  onChange={(e) => setEngagementM(Number(e.target.value))}
                  className="w-full max-w-md accent-zinc-900 dark:accent-zinc-100"
                />
              </label>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-xs text-zinc-500">Build A — FCS assist</dt>
                  <dd className="font-mono text-sm font-medium">
                    {formatNumber(m4A.fcsAssist)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Build A — eff. DPS (est.)</dt>
                  <dd className="font-mono text-sm font-medium">
                    {formatNumber(m4A.effectiveDpsEstimate)}
                  </dd>
                </div>
                {m4B ? (
                  <>
                    <div>
                      <dt className="text-xs text-zinc-500">Build B — FCS assist</dt>
                      <dd className="font-mono text-sm font-medium">
                        {formatNumber(m4B.fcsAssist)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500">Build B — eff. DPS (est.)</dt>
                      <dd className="font-mono text-sm font-medium">
                        {formatNumber(m4B.effectiveDpsEstimate)}
                      </dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </div>
          )}

          {analysisA && (
            <div
              className={`grid gap-8 ${compareOn && analysisB ? "xl:grid-cols-2" : "grid-cols-1"}`}
            >
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                <AnalysisBlock
                  title="Build A"
                  analysis={analysisA}
                  compareAnalysis={compareOn ? analysisB : null}
                />
              </div>
              {compareOn && analysisB ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                  <AnalysisBlock
                    title="Build B"
                    analysis={analysisB}
                    compareAnalysis={analysisA}
                  />
                </div>
              ) : compareOn && !analysisB ? (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Build B is invalid or could not be analyzed.
                </p>
              ) : null}
            </div>
          )}

          {analysisA && (
            <div
              className={
                compareOn && analysisB
                  ? "grid gap-6 xl:grid-cols-2"
                  : undefined
              }
            >
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
          )}
        </section>
      </div>
      </main>
    </>
  );
}
