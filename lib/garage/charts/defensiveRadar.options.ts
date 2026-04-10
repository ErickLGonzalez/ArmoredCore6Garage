import type { EChartsOption } from "echarts";

import type { DefensiveRadarRaw } from "@/lib/garage/charts/dashboard-types";
import { buildTooltipAxis } from "@/lib/garage/charts/commonOptions";
import { chartTheme } from "@/lib/garage/charts/theme";

const DIMS = [
  { key: "ap" as const, label: "AP" },
  { key: "effectiveAp" as const, label: "Eff. AP" },
  { key: "stability" as const, label: "Stability" },
  { key: "kineticDef" as const, label: "Kinetic DEF" },
  { key: "energyDef" as const, label: "Energy DEF" },
  { key: "explosiveDef" as const, label: "Explosive DEF" },
];

function values(d: DefensiveRadarRaw): number[] {
  return DIMS.map(({ key }) => d[key]);
}

export function buildDefensiveRadarChartOption(
  primary: DefensiveRadarRaw,
  compare?: DefensiveRadarRaw | null,
): EChartsOption {
  const p = values(primary);
  const c = compare ? values(compare) : null;

  const indicator = DIMS.map(({ label }, i) => ({
    name: label,
    max: Math.max(p[i]!, c?.[i] ?? 0, 1) * 1.12,
  }));

  const data: {
    value: number[];
    name: string;
    areaStyle?: { opacity: number; color: string };
    lineStyle?: { width: number; type?: "dashed"; color: string };
  }[] = [
    {
      value: p,
      name: "Build",
      areaStyle: { opacity: 0.22, color: chartTheme.cyan },
      lineStyle: { width: 2, color: chartTheme.cyan },
    },
  ];

  if (c) {
    data.push({
      value: c,
      name: "Compare",
      areaStyle: { opacity: 0.12, color: chartTheme.compare },
      lineStyle: {
        width: 2,
        type: "dashed",
        color: chartTheme.compare,
      },
    });
  }

  return {
    animationDuration: 220,
    animationDurationUpdate: 180,
    tooltip: {
      ...buildTooltipAxis(),
      trigger: "item",
      formatter: (params) => {
        const p = params as { seriesName?: string; value?: number[] };
        const raw = p.value;
        const name = p.seriesName ?? "Build";
        if (!raw || !Array.isArray(raw)) return name;
        const rows = [`<div><b>${name}</b></div>`];
        DIMS.forEach(({ label }, i) => {
          const v = raw[i];
          if (typeof v === "number" && Number.isFinite(v)) {
            rows.push(`<div>${label}: ${v.toFixed(0)}</div>`);
          }
        });
        return rows.join("");
      },
    },
    legend: c
      ? {
          data: ["Build", "Compare"],
          bottom: 0,
          textStyle: { color: chartTheme.text, fontSize: 10 },
        }
      : undefined,
    radar: {
      center: ["50%", "48%"],
      radius: "58%",
      axisName: { color: chartTheme.text, fontSize: 10 },
      splitLine: { lineStyle: { color: chartTheme.grid } },
      splitArea: { show: true, areaStyle: { color: ["rgba(255,255,255,0.02)"] } },
      indicator,
    },
    series: [
      {
        type: "radar",
        data,
      },
    ],
  };
}
