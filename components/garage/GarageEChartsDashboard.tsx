"use client";

import { useEffect, useMemo, useState } from "react";

import type { BuildAnalysis } from "@/lib/calc";
import { EChartBase } from "@/components/garage/charts/EChartBase";
import { aimAssistPolylineFromRow, buildAimAssistChartOption } from "@/lib/garage/charts/aimAssistOptions";
import { DEFAULT_RECOIL_THRESHOLDS } from "@/lib/garage/charts/dashboard-types";
import { buildDefensiveRadarChartOption } from "@/lib/garage/charts/defensiveRadar.options";
import { buildEnergyRecoveryChartOption } from "@/lib/garage/charts/energyRecoveryOptions";
import { buildMatchupHeatmapChartOption } from "@/lib/garage/charts/matchupHeatmap.options";
import { buildRecoilChartOption } from "@/lib/garage/charts/recoilOptions";
import {
  summarizeCombatEnvelopeFromPoints,
  summarizeDefense,
  summarizeEnergyFromCurves,
  summarizeMatchups,
  summarizeRecoilTimeline,
} from "@/lib/garage/insights/natural-language-summary";
import {
  getAimAssistPlotData,
  getEnergyRecoveryCurves,
  getRecoilPlotPoints,
} from "@/lib/garage/plot-data";
import {
  selectArchetypeTags,
  selectDefensiveRadarRaw,
  selectEnergyMeterModel,
  selectEnOutput,
  selectMatchupHeatmapModel,
  selectWeightClassLabel,
} from "@/lib/garage/selectors/dashboard-from-analysis";

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 10_000) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumSignificantDigits: 5 });
}

function MetricCard({
  label,
  value,
  delta,
  deltaTone = "none",
}: {
  label: string;
  value: string;
  delta?: string | null;
  deltaTone?: "none" | "pos" | "neg" | "zero";
}) {
  const deltaClass =
    deltaTone === "pos"
      ? "text-emerald-300"
      : deltaTone === "neg"
        ? "text-rose-300"
        : deltaTone === "zero"
          ? "text-cyan-200/70"
          : "text-cyan-200/70";
  return (
    <div className="ac6-inner-frame">
      <p className="text-[9px] font-medium uppercase tracking-[0.06em] text-cyan-200/65">
        {label}
      </p>
      <p className="font-mono text-[13px] font-medium text-cyan-50">{value}</p>
      {delta ? (
        <p className={`mt-0.5 font-mono text-[10px] ${deltaClass}`}>{delta}</p>
      ) : null}
    </div>
  );
}

function InsightStrip({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <div className="ac6-inner-frame mt-1.5">
      <p className="text-[11px] leading-snug text-cyan-100/88">{text}</p>
    </div>
  );
}

function EnergyMetersRow({
  meters,
}: {
  meters: NonNullable<ReturnType<typeof selectEnergyMeterModel>>;
}) {
  const rows: { label: string; pct: number }[] = [
    { label: "EN load vs output", pct: meters.enLoadPct },
    { label: "Generator efficiency", pct: meters.generatorEfficiencyPct },
    { label: "QB demand (vs tank)", pct: meters.boosterDemandPct },
    { label: "Redline risk (heuristic)", pct: meters.redlineRiskPct },
  ];
  return (
    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-0.5 flex justify-between text-[9px] uppercase tracking-wide text-cyan-200/60">
            <span>{r.label}</span>
            <span className="font-mono text-cyan-100/90">
              {Math.round(r.pct)}%
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden border-2 border-[var(--ui-border)]"
            style={{
              background: "color-mix(in srgb, var(--ui-panel-bottom) 90%, black)",
            }}
          >
            <div
              className="h-full"
              style={{
                width: `${Math.min(100, Math.max(0, r.pct))}%`,
                background:
                  "linear-gradient(90deg, var(--ui-tab-bottom), var(--ui-tab-active-top))",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function numDelta(
  a: number,
  b: number | null,
): { text: string | null; tone: "none" | "pos" | "neg" | "zero" } {
  if (b === null || !Number.isFinite(a) || !Number.isFinite(b)) {
    return { text: null, tone: "none" };
  }
  const d = a - b;
  if (!Number.isFinite(d) || Math.abs(d) < 1e-6) {
    return { text: "Δ ±0", tone: "zero" };
  }
  const text = `Δ ${d > 0 ? "+" : ""}${formatNumber(d)}`;
  const tone: "pos" | "neg" = d > 0 ? "pos" : "neg";
  return { text, tone };
}

function invertDeltaTone(
  tone: "none" | "pos" | "neg" | "zero",
): "none" | "pos" | "neg" | "zero" {
  if (tone === "pos") return "neg";
  if (tone === "neg") return "pos";
  return tone;
}

function useCompactGarageCharts(): boolean {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return compact;
}

export function GarageEChartsDashboard({
  analysis,
  compareAnalysis,
}: {
  analysis: BuildAnalysis;
  compareAnalysis: BuildAnalysis | null;
}) {
  const compact = useCompactGarageCharts();
  const cmp = compareAnalysis;

  const aimPrimary = getAimAssistPlotData(analysis.groups);
  const aimCompare = cmp ? getAimAssistPlotData(cmp.groups) : null;
  const recPrimary = getRecoilPlotPoints(analysis.groups);
  const recCompare = cmp ? getRecoilPlotPoints(cmp.groups) : null;
  const enPrimary = getEnergyRecoveryCurves(analysis.groups);
  const enCompare = cmp ? getEnergyRecoveryCurves(cmp.groups) : null;

  const aimOk =
    aimPrimary &&
    aimPrimary.length >= 7 &&
    [4, 5, 6].every((i) => Number.isFinite(aimPrimary[i]!));

  const radarPrimary = useMemo(
    () => selectDefensiveRadarRaw(analysis),
    [analysis],
  );
  const radarCompare = useMemo(
    () => (cmp ? selectDefensiveRadarRaw(cmp) : null),
    [cmp],
  );
  const matchup = useMemo(() => selectMatchupHeatmapModel(analysis), [analysis]);
  const energyMeters = useMemo(
    () => selectEnergyMeterModel(analysis),
    [analysis],
  );
  const weightClass = useMemo(
    () => selectWeightClassLabel(analysis),
    [analysis],
  );
  const tags = useMemo(() => selectArchetypeTags(analysis), [analysis]);
  const enOut = useMemo(() => selectEnOutput(analysis), [analysis]);

  const aimPts = aimOk ? aimAssistPolylineFromRow(aimPrimary!) : null;
  const combatInsight = useMemo(
    () => (aimPts ? summarizeCombatEnvelopeFromPoints(aimPts) : ""),
    [aimPts],
  );
  const energyInsight = useMemo(
    () => (enPrimary ? summarizeEnergyFromCurves(enPrimary) : ""),
    [enPrimary],
  );
  const defenseInsight = useMemo(
    () => summarizeDefense(radarPrimary),
    [radarPrimary],
  );
  const matchupInsight = useMemo(
    () => summarizeMatchups(matchup),
    [matchup],
  );

  const maxRecoil = useMemo(() => {
    if (!recPrimary?.length) return 0;
    return Math.max(...recPrimary.map(([, y]) => y));
  }, [recPrimary]);
  const recoilInsight = useMemo(
    () =>
      recPrimary?.length
        ? summarizeRecoilTimeline(maxRecoil, DEFAULT_RECOIL_THRESHOLDS)
        : "",
    [recPrimary, maxRecoil],
  );

  const aimOption = useMemo(
    () =>
      aimOk
        ? buildAimAssistChartOption(
            aimPrimary!,
            cmp ? aimCompare : null,
          )
        : null,
    [aimOk, aimPrimary, aimCompare, cmp],
  );

  const recoilOption = useMemo(
    () =>
      recPrimary && recPrimary.length > 0
        ? buildRecoilChartOption(
            recPrimary,
            cmp ? recCompare : null,
            DEFAULT_RECOIL_THRESHOLDS,
          )
        : null,
    [recPrimary, recCompare, cmp],
  );

  const energyOption = useMemo(
    () =>
      enPrimary
        ? buildEnergyRecoveryChartOption(enPrimary, cmp ? enCompare : null)
        : null,
    [enPrimary, enCompare, cmp],
  );

  const radarOption = useMemo(
    () => buildDefensiveRadarChartOption(radarPrimary, cmp ? radarCompare : null),
    [radarPrimary, radarCompare, cmp],
  );

  const heatmapOption = useMemo(
    () => buildMatchupHeatmapChartOption(matchup, compact),
    [matchup, compact],
  );

  const enHeadroom =
    enOut > 0 ? formatNumber(enOut - analysis.totalEnLoad) : "—";
  const enDelta =
    cmp && enOut > 0 && selectEnOutput(cmp) > 0
      ? numDelta(
          enOut - analysis.totalEnLoad,
          selectEnOutput(cmp) - cmp.totalEnLoad,
        )
      : { text: null, tone: "none" as const };

  const redlineRisk = energyMeters?.redlineRiskPct ?? 0;
  const redlineCmp = cmp ? selectEnergyMeterModel(cmp)?.redlineRiskPct ?? null : null;
  const redlineDelta = numDelta(redlineRisk, redlineCmp);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-cyan-800/25 pb-2">
        <span className="rounded border border-cyan-600/40 bg-cyan-950/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
          {weightClass}
        </span>
        {tags.map((t) => (
          <span
            key={t}
            className="rounded bg-cyan-900/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-cyan-100/80"
          >
            {t}
          </span>
        ))}
        {cmp ? (
          <span className="text-[10px] text-cyan-200/60">
            Compare on — dashed / second polygon = other set
          </span>
        ) : null}
      </div>

      <div>
        <p className="ac6-chart-section-title mb-1.5">BUILD SNAPSHOT</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          <MetricCard
            label="Boost spd (ground)"
            value={formatNumber(analysis.groundedBoostSpeed)}
            delta={
              cmp
                ? numDelta(analysis.groundedBoostSpeed, cmp.groundedBoostSpeed)
                    .text
                : null
            }
            deltaTone={
              cmp
                ? numDelta(analysis.groundedBoostSpeed, cmp.groundedBoostSpeed)
                    .tone
                : "none"
            }
          />
          <MetricCard
            label="AP"
            value={formatNumber(analysis.totalAp)}
            delta={cmp ? numDelta(analysis.totalAp, cmp.totalAp).text : null}
            deltaTone={
              cmp ? numDelta(analysis.totalAp, cmp.totalAp).tone : "none"
            }
          />
          <MetricCard
            label="Stability"
            value={formatNumber(analysis.totalStability)}
            delta={
              cmp
                ? numDelta(analysis.totalStability, cmp.totalStability).text
                : null
            }
            deltaTone={
              cmp
                ? numDelta(analysis.totalStability, cmp.totalStability).tone
                : "none"
            }
          />
          <MetricCard
            label="EN headroom"
            value={enHeadroom}
            delta={cmp ? enDelta.text : null}
            deltaTone={cmp ? enDelta.tone : "none"}
          />
          <MetricCard
            label="Burst DPS (Σ)"
            value={formatNumber(analysis.burstDps)}
            delta={cmp ? numDelta(analysis.burstDps, cmp.burstDps).text : null}
            deltaTone={
              cmp ? numDelta(analysis.burstDps, cmp.burstDps).tone : "none"
            }
          />
          <MetricCard
            label="Sustained DPS (Σ)"
            value={formatNumber(analysis.dps)}
            delta={cmp ? numDelta(analysis.dps, cmp.dps).text : null}
            deltaTone={cmp ? numDelta(analysis.dps, cmp.dps).tone : "none"}
          />
          <MetricCard
            label="Stagger (acc IPS)"
            value={formatNumber(analysis.accumulativeImpactPerSecond)}
            delta={
              cmp
                ? numDelta(
                    analysis.accumulativeImpactPerSecond,
                    cmp.accumulativeImpactPerSecond,
                  ).text
                : null
            }
            deltaTone={
              cmp
                ? numDelta(
                    analysis.accumulativeImpactPerSecond,
                    cmp.accumulativeImpactPerSecond,
                  ).tone
                : "none"
            }
          />
          <MetricCard
            label="Redline risk"
            value={`${Math.round(redlineRisk)}%`}
            delta={cmp ? redlineDelta.text : null}
            deltaTone={
              cmp ? invertDeltaTone(redlineDelta.tone) : "none"
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {aimOk && aimOption ? (
          <div>
            <p className="ac6-chart-section-title">COMBAT ENVELOPE</p>
            <p className="mb-1 text-[10px] text-cyan-200/55">
              Aim assist vs distance (smooth). Red marks: unit ideal range.
            </p>
            <EChartBase
              className="w-full max-w-lg"
              height={200}
              option={aimOption}
            />
            <InsightStrip text={combatInsight} />
          </div>
        ) : null}

        {energyOption ? (
          <div>
            <p className="ac6-chart-section-title">ENERGY SYSTEMS</p>
            <p className="mb-1 text-[10px] text-cyan-200/55">
              Normal vs redline recharge; shaded delay window.
            </p>
            <EChartBase
              className="w-full max-w-lg"
              height={210}
              option={energyOption}
            />
            {energyMeters ? <EnergyMetersRow meters={energyMeters} /> : null}
            <InsightStrip text={energyInsight} />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {recoilOption ? (
          <div>
            <p className="ac6-chart-section-title">WEAPON HANDLING</p>
            <p className="mb-1 text-[10px] text-cyan-200/55">
              Recoil build-up; bands: stable / unstable / break thresholds.
            </p>
            <EChartBase
              className="w-full max-w-lg"
              height={200}
              option={recoilOption}
            />
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] sm:grid-cols-4">
              <div className="rounded border border-cyan-800/30 px-2 py-1 text-cyan-100/85">
                <span className="text-cyan-200/60">Σ DPS</span>{" "}
                <span className="font-mono">{formatNumber(analysis.dps)}</span>
              </div>
              <div className="rounded border border-cyan-800/30 px-2 py-1 text-cyan-100/85">
                <span className="text-cyan-200/60">Σ burst</span>{" "}
                <span className="font-mono">
                  {formatNumber(analysis.burstDps)}
                </span>
              </div>
              <div className="rounded border border-cyan-800/30 px-2 py-1 text-cyan-100/85">
                <span className="text-cyan-200/60">Impact/s</span>{" "}
                <span className="font-mono">
                  {formatNumber(analysis.impactPerSecond)}
                </span>
              </div>
              <div className="rounded border border-cyan-800/30 px-2 py-1 text-cyan-100/85">
                <span className="text-cyan-200/60">Acc IPS</span>{" "}
                <span className="font-mono">
                  {formatNumber(analysis.accumulativeImpactPerSecond)}
                </span>
              </div>
            </div>
            <InsightStrip text={recoilInsight} />
          </div>
        ) : null}

        <div>
          <p className="ac6-chart-section-title">DEFENSIVE PROFILE</p>
          <p className="mb-1 text-[10px] text-cyan-200/55">
            Raw stats on radar axes (max scales to the larger set when
            comparing).
          </p>
          <EChartBase
            className="w-full max-w-lg"
            height={280}
            option={radarOption}
          />
          <InsightStrip text={defenseInsight} />
        </div>
      </div>

      <div>
        <p className="ac6-chart-section-title">MATCHUP INSIGHTS (HEURISTIC)</p>
        <p className="mb-1 text-[10px] text-cyan-200/55">
          Exploratory grid from mobility, bulk, and sigma weapon stats — not
          sim-validated.
        </p>
        <EChartBase
          className="w-full max-w-2xl"
          height={compact ? 320 : 300}
          option={heatmapOption}
        />
        <InsightStrip text={matchupInsight} />
      </div>
    </div>
  );
}
