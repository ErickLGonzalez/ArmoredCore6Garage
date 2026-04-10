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

export function GarageLegacyStatGroupsSection({
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
    <div className="rounded border border-cyan-300/35 bg-cyan-950/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">
        Diff Preview (A vs B)
      </p>
      {diffs.length === 0 ? (
        <p className="mt-2 text-xs text-cyan-200/70">No slot differences.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-xs text-cyan-100/90">
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
