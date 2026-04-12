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

function rows(d: DefensiveRadarRaw) {
  return DIMS.map(({ key, label }) => ({
    name: label,
    value: d[key],
  }));
}

export function buildDefensiveBarsChartOption(
  primary: DefensiveRadarRaw,
  compare?: DefensiveRadarRaw | null,
): EChartsOption {
  const p = rows(primary);
  const c = compare ? rows(compare) : null;
  const max = Math.max(
    1,
    ...p.map((r) => r.value),
    ...(c ? c.map((r) => r.value) : []),
  );

  return {
    animationDuration: 700,
    animationDurationUpdate: 450,
    animationEasing: "cubicOut",
    animationEasingUpdate: "quarticOut",
    tooltip: {
      ...buildTooltipAxis(),
      trigger: "axis",
      axisPointer: {
        type: "shadow",
        shadowStyle: {
          color: "rgba(34, 211, 238, 0.08)",
        },
      },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const first = list[0] as { axisValue?: unknown };
        const label = String(first?.axisValue ?? "");
        const body = [`<div><b>${label}</b></div>`];
        for (const item of list) {
          const seriesName = String(item.seriesName ?? "Build");
          if (seriesName === "Backplate") continue;
          const value = Array.isArray(item.value) ? item.value[1] : item.value;
          if (typeof value === "number" && Number.isFinite(value)) {
            body.push(`<div>${seriesName}: ${value.toFixed(0)}</div>`);
          }
        }
        return body.join("");
      },
    },
    legend: compare
      ? {
          data: ["Build", "Compare"],
          bottom: 0,
          textStyle: { color: chartTheme.text, fontSize: 10 },
        }
      : { show: false },
    grid: {
      top: 18,
      right: 10,
      bottom: compare ? 38 : 16,
      left: 10,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: p.map((r) => r.name),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: chartTheme.grid } },
      axisLabel: {
        color: chartTheme.text,
        fontSize: 10,
        interval: 0,
        rotate: 0,
      },
    },
    yAxis: {
      type: "value",
      max: max * 1.12,
      splitNumber: 4,
      axisLabel: { color: chartTheme.subtext, fontSize: 9 },
      splitLine: { lineStyle: { color: chartTheme.grid, type: "dashed" } },
    },
    series: [
      {
        name: "Backplate",
        type: "bar",
        silent: true,
        barGap: "-100%",
        barWidth: 18,
        z: 1,
        itemStyle: {
          color: "rgba(255,255,255,0.03)",
          borderColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
          borderRadius: [4, 4, 0, 0],
        },
        data: p.map(() => max),
      },
      {
        name: "Build",
        type: "bar",
        z: 3,
        barWidth: 18,
        showBackground: false,
        label: {
          show: true,
          position: "top",
          color: "#dffaff",
          fontSize: 10,
          formatter: ({ value }) => {
            const raw = Array.isArray(value) ? value[1] : value;
            return typeof raw === "number" ? `${Math.round(raw)}` : "";
          },
        },
        emphasis: {
          focus: "series",
        },
        itemStyle: {
          borderColor: "rgba(255,255,255,0.18)",
          borderWidth: 1,
          borderRadius: [4, 4, 0, 0],
          shadowBlur: 12,
          shadowColor: "rgba(34, 211, 238, 0.35)",
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(160, 247, 255, 0.98)" },
              { offset: 0.3, color: chartTheme.cyan },
              { offset: 1, color: "rgba(8, 68, 84, 0.96)" },
            ],
          },
        },
        animationDelay: (idx: number) => idx * 90,
        animationDelayUpdate: (idx: number) => idx * 40,
        data: p.map((r) => ({
          name: r.name,
          value: r.value,
        })),
      },
      ...(c
        ? [
            {
              name: "Compare",
              type: "bar" as const,
              z: 4,
              barWidth: 10,
              barGap: "-58%",
              itemStyle: {
                borderColor: "rgba(255,255,255,0.16)",
                borderWidth: 1,
                borderRadius: [3, 3, 0, 0],
                opacity: 0.9,
                color: {
                  type: "linear" as const,
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: "rgba(255, 236, 170, 0.96)" },
                    { offset: 0.35, color: chartTheme.compare },
                    { offset: 1, color: "rgba(102, 74, 9, 0.95)" },
                  ],
                },
              },
              label: { show: false },
              animationDelay: (idx: number) => idx * 90 + 120,
              animationDelayUpdate: (idx: number) => idx * 40,
              data: c.map((r) => ({
                name: r.name,
                value: r.value,
              })),
            },
          ]
        : []),
    ],
  };
}
