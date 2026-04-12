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
    symbol?: string;
    symbolSize?: number;
  }[] = [
    {
      value: p,
      name: "Build",
      symbol: "circle",
      symbolSize: 6,
      areaStyle: { opacity: 0.24, color: chartTheme.cyan },
      lineStyle: { width: 2.5, color: chartTheme.cyan },
    },
  ];

  if (c) {
    data.push({
      value: c,
      name: "Compare",
      symbol: "circle",
      symbolSize: 5,
      areaStyle: { opacity: 0.1, color: chartTheme.compare },
      lineStyle: {
        width: 2,
        type: "dashed",
        color: chartTheme.compare,
      },
    });
  }

  return {
    animationDuration: 680,
    animationDurationUpdate: 380,
    animationEasing: "cubicOut",
    animationEasingUpdate: "quarticOut",
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
      axisName: {
        color: chartTheme.text,
        fontSize: 10,
      },
      axisLine: {
        lineStyle: { color: "rgba(34, 211, 238, 0.2)" },
      },
      splitLine: { lineStyle: { color: chartTheme.grid } },
      splitArea: {
        show: true,
        areaStyle: {
          color: [
            "rgba(255,255,255,0.02)",
            "rgba(34,211,238,0.015)",
          ],
        },
      },
      indicator,
    },
    series: [
      {
        type: "radar",
        emphasis: {
          lineStyle: { width: 3 },
        },
        data,
      },
    ],
  };
}
