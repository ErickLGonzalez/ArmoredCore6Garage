"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";

import { GarageAssemblyPartPicker } from "@/components/garage/GarageAssemblyPartPicker";
import { PartThumbnail } from "@/components/garage/PartThumbnail";
import { GarageEChartsDashboard } from "@/components/garage/GarageEChartsDashboard";
import { REQUIRED_ASSEMBLY_SLOTS, type BuildAnalysis } from "@/lib/calc";
import type { LegacyStatRow } from "@/lib/calc/types";
import type { GarageBuildIds } from "@/lib/garage/default-assembly";
import {
  EXPANSION_SLOT_LABEL,
  SLOT_LABELS,
  type RequiredSlot,
} from "@/lib/garage/slot-options";
import type { CanonicalPart } from "@/lib/schema";

const SUMMARY_METRICS: { key: keyof BuildAnalysis; label: string }[] = [
  { key: "totalWeight", label: "TOTAL WEIGHT" },
  { key: "totalEnLoad", label: "TOTAL EN LOAD" },
  { key: "totalAp", label: "AP" },
  { key: "totalDef", label: "MEAN FRAME DEF" },
  { key: "totalStability", label: "ATTITUDE STABILITY" },
  { key: "groundedBoostSpeed", label: "BOOST SPEED (GROUND)" },
  { key: "qbReload", label: "QB RELOAD TIME" },
  { key: "enSupplyEfficiency", label: "EN SUPPLY EFFICIENCY" },
  { key: "dps", label: "SIGMA DAMAGE/S (ALL UNITS)" },
  { key: "burstDps", label: "SIGMA BURST DPS (W/ RELOAD)" },
  { key: "impactPerSecond", label: "SIGMA IMPACT/S" },
  { key: "accumulativeImpactPerSecond", label: "SIGMA ACC IMPACT/S" },
];

const SLOT_GROUPS: { label: string; slots: RequiredSlot[] }[] = [
  { label: "WEAPONS", slots: ["rightArm", "leftArm", "rightBack", "leftBack"] },
  { label: "FRAME", slots: ["head", "core", "arms", "legs"] },
  { label: "INTERNALS", slots: ["booster", "fcs", "generator"] },
];

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

function isPlotRowType(row: LegacyStatRow): boolean {
  return (
    row.type === "RangePlot" ||
    row.type === "RecoilPlot" ||
    row.type === "EnergyPlot"
  );
}

function rowByName(group: LegacyStatRow[] | undefined, name: string): LegacyStatRow | undefined {
  return group?.find((r) => r.name === name);
}

type NormalizeMode = "off" | "weight" | "en";

const SS_SPECS_NORMALIZE = "moa-garage-specs-normalize";
const SS_SPECS_MODIFIED = "moa-garage-specs-modified-preview";

/** Rows excluded from AC-wide normalize (classic leaves weight / EN-load rows unchanged). */
const NORMALIZE_EXCLUDE = new Set(["TotalWeight", "TotalENLoad"]);

/** Numerator stat name → denominator row in same group (classic proportion rows). */
const STAT_PROPORTION_LIMIT: Partial<Record<string, string>> = {
  TotalArmsLoad: "ArmsLoadLimit",
  TotalLoad: "LoadLimit",
  TotalENLoad: "ENOutput",
};

function transformStatDisplay(
  v: unknown,
  mode: NormalizeMode,
  totalWeight: number,
  totalEnLoad: number,
  rowName: string,
): unknown {
  if (mode === "off" || NORMALIZE_EXCLUDE.has(rowName)) return v;
  const n = statNumeric(v);
  if (n == null) return v;
  if (mode === "weight" && totalWeight > 0) return (n / totalWeight) * 1000;
  if (mode === "en" && totalEnLoad > 0) return (n / totalEnLoad) * 100;
  return v;
}

function statNumeric(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function SpecsValueWithBar({
  group,
  row,
  alignEnd,
  normalizeMode = "off",
  totalWeight,
  totalEnLoad,
}: {
  group: LegacyStatRow[];
  row: LegacyStatRow;
  alignEnd?: boolean;
  normalizeMode?: NormalizeMode;
  totalWeight: number;
  totalEnLoad: number;
}): ReactNode {
  const limitName = STAT_PROPORTION_LIMIT[row.name];
  const limitRow = limitName ? rowByName(group, limitName) : undefined;
  const limit = limitRow ? statNumeric(limitRow.value) : null;
  const val = statNumeric(row.value);
  const showBar =
    limit != null && limit > 0 && val != null && Number.isFinite(val) && val >= 0;
  const pct = showBar ? Math.min(100, (val / limit) * 100) : 0;
  const overload =
    showBar && row.name === "TotalENLoad" && val > limit;
  const displayVal = transformStatDisplay(
    row.value,
    normalizeMode,
    totalWeight,
    totalEnLoad,
    row.name,
  );
  return (
    <div
      className={`ac6-specs-value-stack${alignEnd ? " ac6-specs-value-stack--end" : ""}`}
    >
      <span className="ac6-specs-value-num">{formatStatValue(displayVal)}</span>
      {showBar ? (
        <div
          className={`ac6-specs-prop-track${overload ? " ac6-specs-prop-track--overload" : ""}`}
          title={`${formatNumber(val)} / ${formatNumber(limit)}`}
        >
          <div
            className={`ac6-specs-prop-fill${overload ? " ac6-specs-prop-fill--overload" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function formatDeltaCell(a: unknown, b: unknown): ReactNode {
  const na = statNumeric(a);
  const nb = statNumeric(b);
  if (na == null || nb == null) return "—";
  const d = na - nb;
  if (!Number.isFinite(d) || Math.abs(d) < 1e-9) {
    return <span className="ac6-specs-delta-neutral">0</span>;
  }
  const cls = d > 0 ? "ac6-specs-delta-pos" : "ac6-specs-delta-neg";
  return (
    <span className={cls}>
      {d > 0 ? "+" : ""}
      {formatNumber(d)}
    </span>
  );
}

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

export function GarageSlotColumn({
  label,
  idPrefix,
  ids,
  setIds,
  optionsBySlot,
  expansionOptions,
  onInteract,
  onHover,
}: SlotColumnProps) {
  const [picker, setPicker] = useState<
    { mode: "slot"; slot: RequiredSlot } | { mode: "expansion" } | null
  >(null);

  const setSlot = useCallback(
    (slot: RequiredSlot, id: number) => {
      setIds((prev) => ({ ...prev, [slot]: id }));
    },
    [setIds],
  );

  const closePicker = useCallback(() => {
    setPicker(null);
  }, []);

  return (
    <>
    <div className="ac6-stack ac6-assembly-column">
      <div className="ac6-strip ac6-assembly-set-strip">
        <p className="ac6-block-title leading-none">{label}</p>
      </div>
      {SLOT_GROUPS.map((group) => (
        <div
          key={group.label}
          className="ac6-assembly-group"
        >
          <div className="ac6-strip ac6-assembly-group-strip">
            <p className="ac6-chart-section-title m-0">{group.label}</p>
          </div>
          <div className="ac6-assembly-slot-grid">
            {group.slots.map((slot) => {
              const opts = optionsBySlot.get(slot) ?? [];
              const sid = `${idPrefix}-${slot}`;
              const selectedPart = opts.find((p) => p.identity.id === ids[slot]);
              const selectedName = selectedPart?.identity.name ?? "";
              return (
                <div
                  key={slot}
                  className="ac6-assembly-slot-tile"
                >
                  <button
                    type="button"
                    className="ac6-assembly-slot-thumb-btn"
                    aria-label={`Open part list for ${SLOT_LABELS[slot]}`}
                    onClick={() => {
                      onInteract?.();
                      setPicker({ mode: "slot", slot });
                    }}
                  >
                    <div className="ac6-assembly-slot-thumb">
                      <PartThumbnail
                        partName={selectedName}
                        size="sm"
                      />
                    </div>
                  </button>
                  <label
                    htmlFor={sid}
                    className="ac6-assembly-slot-label min-w-0"
                  >
                    {SLOT_LABELS[slot]}
                  </label>
                  <select
                    id={sid}
                    className="ac6-slot-select min-w-0 max-w-full border-2 outline-none"
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
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="ac6-assembly-group">
        <div className="ac6-strip ac6-assembly-group-strip">
          <p className="ac6-chart-section-title m-0">EXPANSION</p>
        </div>
        <div className="ac6-assembly-slot-grid ac6-assembly-slot-grid--single">
          <div className="ac6-assembly-slot-tile">
            <button
              type="button"
              className="ac6-assembly-slot-thumb-btn"
              aria-label="Open part list for expansion"
              onClick={() => {
                onInteract?.();
                setPicker({ mode: "expansion" });
              }}
            >
              <div className="ac6-assembly-slot-thumb">
                <PartThumbnail
                  partName={
                    expansionOptions.find((p) => p.identity.id === ids.expansionId)?.identity.name ??
                    ""
                  }
                  size="sm"
                />
              </div>
            </button>
            <label
              htmlFor={`${idPrefix}-expansion`}
              className="ac6-assembly-slot-label min-w-0"
            >
              {EXPANSION_SLOT_LABEL}
            </label>
            <select
              id={`${idPrefix}-expansion`}
              className="ac6-slot-select min-w-0 max-w-full border-2 outline-none"
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
          </div>
        </div>
      </div>
    </div>
    <GarageAssemblyPartPicker
      open={picker !== null}
      title={
        picker?.mode === "expansion"
          ? EXPANSION_SLOT_LABEL
          : picker
            ? SLOT_LABELS[picker.slot]
            : ""
      }
      options={
        picker?.mode === "expansion"
          ? expansionOptions
          : picker
            ? (optionsBySlot.get(picker.slot) ?? [])
            : []
      }
      selectedId={
        picker?.mode === "expansion"
          ? ids.expansionId
          : picker
            ? ids[picker.slot]
            : 0
      }
      onPick={(id) => {
        onInteract?.();
        const p = picker;
        if (!p) return;
        if (p.mode === "expansion") {
          setIds((prev) => ({ ...prev, expansionId: id }));
        } else {
          setSlot(p.slot, id);
        }
      }}
      onClose={closePicker}
    />
    </>
  );
}

export function GarageAnalysisBlock({
  title,
  analysis,
  compareAnalysis,
}: {
  title: string;
  analysis: BuildAnalysis;
  compareAnalysis: BuildAnalysis | null;
}) {
  return (
    <div className="space-y-2.5">
      <h3 className="ac6-block-title">
        {title}
      </h3>
      <GarageEChartsDashboard
        analysis={analysis}
        compareAnalysis={compareAnalysis}
      />
      <div>
        <div className="ac6-strip mb-2">
          <p className="ac6-chart-section-title m-0">AC SPECS</p>
        </div>
        <dl className="ac6-stat-grid grid gap-1.5 sm:grid-cols-2">
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
                delta = "+/-0";
              }
            }
            return (
              <div key={key}>
                <dt className="text-cyan-200/70">{label}</dt>
                <dd className="font-mono font-medium text-cyan-50">
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

export function GarageLegacyStatGroupsSection({
  analysis,
  analysisModified = null,
  title,
  compareAnalysis = null,
  compareAnalysisModified = null,
}: {
  analysis: BuildAnalysis;
  /** When "modified unit specs" is on, prefer this analysis (from `analyzeBuild(..., { modifiedUnitStats: true })`). */
  analysisModified?: BuildAnalysis | null;
  title: string;
  compareAnalysis?: BuildAnalysis | null;
  compareAnalysisModified?: BuildAnalysis | null;
}) {
  const [normalizeMode, setNormalizeMode] = useState<NormalizeMode>("off");
  const [modifiedPreview, setModifiedPreview] = useState(false);

  useEffect(() => {
    try {
      const n = sessionStorage.getItem(SS_SPECS_NORMALIZE);
      if (n === "off" || n === "weight" || n === "en") {
        setNormalizeMode(n);
      }
      setModifiedPreview(sessionStorage.getItem(SS_SPECS_MODIFIED) === "1");
    } catch {
      /* private mode / SSR */
    }
  }, []);

  const setNormalizeModePersist = useCallback((mode: NormalizeMode) => {
    setNormalizeMode(mode);
    try {
      sessionStorage.setItem(SS_SPECS_NORMALIZE, mode);
    } catch {
      /* ignore */
    }
  }, []);

  const setModifiedPreviewPersist = useCallback((on: boolean) => {
    setModifiedPreview(on);
    try {
      sessionStorage.setItem(SS_SPECS_MODIFIED, on ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const activeAnalysis =
    modifiedPreview && analysisModified != null ? analysisModified : analysis;
  const activeCompare =
    modifiedPreview && compareAnalysisModified != null
      ? compareAnalysisModified
      : compareAnalysis;

  const twA = activeAnalysis.totalWeight;
  const telA = activeAnalysis.totalEnLoad;
  const twB = activeCompare?.totalWeight ?? 0;
  const telB = activeCompare?.totalEnLoad ?? 0;

  const groupTitle = (i: number) =>
    [
      "DURABILITY",
      "OFFENSIVE",
      "MOBILITY",
      "ENERGY",
      "LIMITS",
    ][i] ?? `GROUP ${i + 1}`;
  return (
    <div className="ac6-specs-panel">
      <h3 className="ac6-block-title">
        {title}
      </h3>
      <div
        className="ac6-specs-toolbar"
        role="region"
        aria-label="AC spec display options (classic layout)"
      >
        <div className="ac6-specs-toolbar-cluster">
          <label
            className="ac6-specs-toolbar-control ac6-specs-toolbar-control--interactive"
            title="Rescale flagged units: IsMeleeSpec from arms Melee Specialization; IsEnergyFirearmSpec from generator Energy Firearm Spec (spec÷100 on attack rows; charge time ×100÷spec). FCS assists unchanged."
          >
            <input
              type="checkbox"
              checked={modifiedPreview}
              onChange={(e) => setModifiedPreviewPersist(e.target.checked)}
              className="ac6-specs-toolbar-checkbox"
            />
            <span className="ac6-specs-toolbar-label-text">SHOW MODIFIED UNIT SPECS</span>
          </label>
        </div>
        <div className="ac6-specs-toolbar-cluster">
          <label
            className="ac6-specs-toolbar-control ac6-specs-toolbar-control--interactive"
            title="AC-wide display scale: ÷ total AC weight × 1000, or ÷ total EN load × 100 (classic normalize shape; not per-part inspector)."
          >
            <span className="ac6-specs-toolbar-prefix">NORMALIZE SPECS:</span>
            <select
              value={normalizeMode}
              onChange={(e) => setNormalizeModePersist(e.target.value as NormalizeMode)}
              className="ac6-specs-toolbar-select ac6-slot-select"
            >
              <option value="off">OFF</option>
              <option value="weight">PER 1000 WT</option>
              <option value="en">PER 100 EN</option>
            </select>
          </label>
        </div>
      </div>
      {modifiedPreview ? (
        <p className="ac6-specs-modified-banner">
          MODIFIED UNIT SPECS: melee and energy-firearm units use arms / generator specialization ratios (neutral at 100); derived DPS is recomputed. Classic parity is approximate.
        </p>
      ) : null}
      <p className="ac6-specs-toolbar-footnote">
        Normalize rescales numeric table cells only (Δ stays raw). Bars use raw load vs limit. Total weight /
        EN load rows are excluded from normalize. Toolbar choices persist for this tab (session).
      </p>
      <div className="ac6-specs-groups mt-1.5 space-y-1.5">
        {activeAnalysis.groups.map((group, gi) => {
          const groupB = activeCompare?.groups[gi];
          const nStats = group.length;
          return (
            <details
              key={gi}
              className="group ac6-details-block"
            >
              <summary>
                <span className="ac6-details-summary-label">
                  {groupTitle(gi)}
                </span>
                <span className="ac6-details-summary-meta">
                  ({nStats} STATS)
                </span>
              </summary>
              <div className="ac6-details-table-wrap">
                <table
                  className={`ac6-specs-table w-full text-left${activeCompare ? " ac6-specs-table--compare" : ""}`}
                >
                  {activeCompare ? (
                    <thead>
                      <tr>
                        <th scope="col">STAT</th>
                        <th
                          scope="col"
                          className="ac6-specs-compare-build"
                        >
                          BUILD A
                        </th>
                        <th
                          scope="col"
                          className="ac6-specs-compare-build"
                        >
                          BUILD B
                        </th>
                        <th
                          scope="col"
                          className="ac6-specs-delta-head"
                        >
                          Δ
                        </th>
                      </tr>
                    </thead>
                  ) : null}
                  <tbody>
                    {group.map((rowA) => {
                      const rowB = rowByName(groupB, rowA.name);
                      if (isPlotRowType(rowA)) {
                        return (
                          <tr key={rowA.name}>
                            <th scope="row">{rowA.name}</th>
                            {activeCompare ? (
                              <td
                                colSpan={3}
                                className="ac6-specs-plot-note"
                              >
                                RANGE / RECOIL / EN CURVES — SEE ECHARTS IN ANALYSIS
                                COLUMN
                              </td>
                            ) : (
                              <td className="ac6-specs-plot-note">
                                RANGE / RECOIL / EN CURVES — SEE ECHARTS IN ANALYSIS
                                COLUMN
                              </td>
                            )}
                          </tr>
                        );
                      }
                      return (
                        <tr key={rowA.name}>
                          <th scope="row">{rowA.name}</th>
                          {activeCompare ? (
                            <>
                              <td className="ac6-specs-value-cell">
                                <SpecsValueWithBar
                                  group={group}
                                  row={rowA}
                                  alignEnd
                                  normalizeMode={normalizeMode}
                                  totalWeight={twA}
                                  totalEnLoad={telA}
                                />
                              </td>
                              <td className="ac6-specs-value-cell">
                                {rowB ? (
                                  <SpecsValueWithBar
                                    group={groupB ?? []}
                                    row={rowB}
                                    alignEnd
                                    normalizeMode={normalizeMode}
                                    totalWeight={twB}
                                    totalEnLoad={telB}
                                  />
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="ac6-specs-delta-cell">
                                {rowB ? formatDeltaCell(rowA.value, rowB.value) : "—"}
                              </td>
                            </>
                          ) : (
                            <td>
                              <SpecsValueWithBar
                                group={group}
                                row={rowA}
                                normalizeMode={normalizeMode}
                                totalWeight={twA}
                                totalEnLoad={telA}
                              />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

export function GarageBuildDiffPreview({
  buildA,
  buildB,
  byId,
}: {
  buildA: GarageBuildIds;
  buildB: GarageBuildIds;
  byId: Map<number, CanonicalPart>;
}) {
  const diffs = REQUIRED_ASSEMBLY_SLOTS.filter(
    (slot) => buildA[slot] !== buildB[slot],
  ).map((slot) => ({
    slot: SLOT_LABELS[slot],
    a: byId.get(buildA[slot])?.identity.name ?? String(buildA[slot]),
    b: byId.get(buildB[slot])?.identity.name ?? String(buildB[slot]),
  }));
  return (
    <div className="ac6-block p-2">
      <div className="ac6-strip mb-1">
        <p className="ac6-block-title leading-none">
          AC SET DIFF (A VS B)
        </p>
      </div>
      {diffs.length === 0 ? (
        <p className="ac6-chart-hint mt-1 uppercase tracking-[0.05em]">
          NO SLOT DIFFERENCES.
        </p>
      ) : (
        <ul className="mt-1 space-y-1.5 text-[11px] text-cyan-100/90">
          {diffs.map((d) => (
            <li
              key={d.slot}
              className="flex flex-wrap items-center gap-1 font-mono"
            >
              <span className="w-full text-[10px] font-bold uppercase tracking-[0.06em] text-cyan-200/80">
                {d.slot}
              </span>
              <PartThumbnail partName={d.a} />
              <span className="max-w-[42%] truncate">{d.a}</span>
              <span className="text-cyan-200/70">→</span>
              <PartThumbnail partName={d.b} />
              <span className="max-w-[42%] truncate">{d.b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
