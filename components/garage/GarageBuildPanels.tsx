"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";

import { AimAssistPlot } from "@/components/garage/AimAssistPlot";
import { EnergyRecoveryPlot } from "@/components/garage/EnergyRecoveryPlot";
import { RecoilPlot } from "@/components/garage/RecoilPlot";
import { REQUIRED_ASSEMBLY_SLOTS, type BuildAnalysis } from "@/lib/calc";
import type { LegacyStatRow } from "@/lib/calc/types";
import type { GarageBuildIds } from "@/lib/garage/default-assembly";
import {
  getAimAssistPlotData,
  getEnergyRecoveryCurves,
  getRecoilPlotPoints,
} from "@/lib/garage/plot-data";
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

function skipCollapsibleRow(row: LegacyStatRow): boolean {
  return (
    row.type === "RangePlot" ||
    row.type === "RecoilPlot" ||
    row.type === "EnergyPlot"
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
  const setSlot = useCallback(
    (slot: RequiredSlot, id: number) => {
      setIds((prev) => ({ ...prev, [slot]: id }));
    },
    [setIds],
  );

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-cyan-200/80">
        {label}
      </p>
      {SLOT_GROUPS.map((group) => (
        <div
          key={group.label}
          className="space-y-1.5"
        >
          <p className="text-[10px] uppercase tracking-[0.06em] text-cyan-200/60">
            {group.label}
          </p>
          {group.slots.map((slot) => {
            const opts = optionsBySlot.get(slot) ?? [];
            const sid = `${idPrefix}-${slot}`;
            return (
              <label
                key={slot}
                htmlFor={sid}
                className="block text-[12px]"
              >
                <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-[0.04em] text-cyan-100/85">
                  {SLOT_LABELS[slot]}
                </span>
                <select
                  id={sid}
                  className="ac6-slot-select w-full border-2 px-1.5 py-[2px] text-[11px] outline-none"
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
        className="block text-[12px]"
      >
        <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-[0.04em] text-cyan-100/85">
          {EXPANSION_SLOT_LABEL}
        </span>
        <select
          id={`${idPrefix}-expansion`}
          className="ac6-slot-select w-full border-2 px-1.5 py-[2px] text-[11px] outline-none focus:border-cyan-200 focus:ring-2 focus:ring-cyan-400/20"
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

export function GarageAnalysisBlock({
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
    <div className="space-y-2.5 text-cyan-50">
      <h3 className="ac6-block-title">
        {title}
      </h3>
      {aimOk ? (
        <div>
          <p className="ac6-chart-section-title">
            AIM ASSIST
          </p>
          <AimAssistPlot
            className="h-44 w-full max-w-md"
            primary={aimPrimary!}
            compare={compareAnalysis ? aimCompare : null}
          />
        </div>
      ) : null}
      {recPrimary && recPrimary.length > 0 ? (
        <div>
          <p className="ac6-chart-section-title">
            RECOIL
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
          <p className="ac6-chart-section-title">
            ENERGY
          </p>
          <EnergyRecoveryPlot
            className="h-48 w-full max-w-md"
            primary={enPrimary}
            compare={compareAnalysis ? enCompare : null}
          />
        </div>
      ) : null}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cyan-200/70">
          AC SPECS
        </p>
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
  title,
}: {
  analysis: BuildAnalysis;
  title: string;
}) {
  const groupTitle = (i: number) =>
    [
      "DURABILITY",
      "OFFENSIVE",
      "MOBILITY",
      "ENERGY",
      "LIMITS",
    ][i] ?? `GROUP ${i + 1}`;
  return (
    <div className="ac6-block p-2">
      <h3 className="ac6-block-title">
        {title}
      </h3>
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.05em] text-cyan-200/70">
        RANGE, RECOIL, AND EN RECOVERY PLOT ROWS OMITTED (SEE CHARTS ABOVE).
      </p>
      <div className="mt-2 space-y-1.5">
        {analysis.groups.map((group, gi) => (
          <details
            key={gi}
            className="group ac6-details-block"
          >
            <summary className="cursor-pointer select-none px-2 py-1 text-[12px] font-medium text-cyan-100 hover:bg-cyan-800/20">
              {groupTitle(gi)}{" "}
              <span className="font-normal text-cyan-200/70">
                ({group.filter((r) => !skipCollapsibleRow(r)).length} STATS)
              </span>
            </summary>
            <div>
              <table className="w-full text-left text-xs">
                <tbody>
                  {group
                    .filter((row) => !skipCollapsibleRow(row))
                    .map((row) => (
                      <tr
                        key={row.name}
                      >
                        <th className="w-[40%] px-2 py-1 font-medium text-cyan-100">
                          {row.name}
                        </th>
                        <td className="break-all px-2 py-1 font-mono text-cyan-50/90">
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
        <p className="mt-1 text-[10px] uppercase tracking-[0.05em] text-cyan-200/70">NO SLOT DIFFERENCES.</p>
      ) : (
        <ul className="mt-1 space-y-0.5 text-[11px] text-cyan-100/90">
          {diffs.map((d) => (
            <li key={d.slot} className="font-mono">
              <span className="text-cyan-200/70">{d.slot}: </span>
              {d.a} <span className="text-cyan-200/70">→</span> {d.b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
