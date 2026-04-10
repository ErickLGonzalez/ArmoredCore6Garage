import type { EChartsOption } from "echarts";

import type { MatchupHeatmapModel } from "@/lib/garage/charts/dashboard-types";
import {
  MATCHUP_COLS,
  MATCHUP_ROWS,
} from "@/lib/garage/charts/dashboard-types";
import { buildTooltipAxis } from "@/lib/garage/charts/commonOptions";
import { chartTheme } from "@/lib/garage/charts/theme";

export function buildMatchupHeatmapChartOption(
  data: MatchupHeatmapModel,
  compact?: boolean,
): EChartsOption {
  const heatData: [number, number, number][] = [];
  for (let yi = 0; yi < MATCHUP_ROWS.length; yi++) {
    for (let xi = 0; xi < MATCHUP_COLS.length; xi++) {
      const v = data.scores[yi]?.[xi] ?? 0;
      heatData.push([xi, yi, v]);
    }
  }

  return {
    animationDuration: 220,
    grid: { top: 28, right: 12, bottom: compact ? 56 : 48, left: 12, containLabel: true },
    tooltip: {
      ...buildTooltipAxis(),
      position: "top",
      formatter: (p) => {
        const arr = (p as { data?: [number, number, number] }).data;
        if (!arr || arr.length < 3) return "";
        const xi = arr[0]!;
        const yi = arr[1]!;
        const score = arr[2]!;
        const row = MATCHUP_ROWS[yi] ?? "";
        const col = MATCHUP_COLS[xi] ?? "";
        const note = data.notes?.[yi]?.[xi];
        return [
          `<div><b>${row}</b> × ${col}</div>`,
          `<div>Score: ${score}</div>`,
          note ? `<div class="opacity-80">${note}</div>` : "",
        ]
          .filter(Boolean)
          .join("");
      },
    },
    xAxis: {
      type: "category",
      data: [...MATCHUP_COLS],
      splitArea: { show: true },
      axisLabel: {
        color: chartTheme.text,
        fontSize: compact ? 0 : 10,
        interval: 0,
        rotate: compact ? 45 : 0,
      },
    },
    yAxis: {
      type: "category",
      data: [...MATCHUP_ROWS],
      splitArea: { show: true },
      axisLabel: { color: chartTheme.text, fontSize: compact ? 9 : 10 },
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: false,
      orient: "horizontal",
      left: "center",
      bottom: 4,
      textStyle: { color: chartTheme.text, fontSize: 9 },
      inRange: {
        color: ["#1e3a5f", "#22d3ee", "#f6c453"],
      },
    },
    series: [
      {
        type: "heatmap",
        data: heatData,
        label: {
          show: !compact,
          color: "#fafafa",
          fontSize: 9,
          formatter: (x) => {
            const d = (x as { data?: unknown }).data;
            if (Array.isArray(d) && typeof d[2] === "number") {
              return String(Math.round(d[2]));
            }
            return "";
          },
        },
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowColor: "rgba(0,0,0,0.35)" },
        },
      },
    ],
  };
}
