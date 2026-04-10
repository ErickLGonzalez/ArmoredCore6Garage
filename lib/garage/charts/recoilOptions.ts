import type { EChartsOption } from "echarts";

import type { RecoilThresholds } from "@/lib/garage/charts/dashboard-types";
import { DEFAULT_RECOIL_THRESHOLDS } from "@/lib/garage/charts/dashboard-types";
import {
  axisLabelStyle,
  axisNameStyle,
  buildCommonGrid,
  buildTooltipAxis,
  splitLineStyle,
} from "@/lib/garage/charts/commonOptions";
import { chartTheme } from "@/lib/garage/charts/theme";

export function buildRecoilChartOption(
  primary: [number, number][],
  compare?: [number, number][] | null,
  thresholds: RecoilThresholds = DEFAULT_RECOIL_THRESHOLDS,
): EChartsOption {
  const { stable, unstable, break: breakAt } = thresholds;

  const series: EChartsOption["series"] = [
    {
      type: "line",
      name: "Build",
      smooth: false,
      showSymbol: false,
      data: primary,
      lineStyle: { width: 2.5, color: chartTheme.cyan },
      areaStyle: { color: "rgba(34, 211, 238, 0.1)" },
      markLine: {
        symbol: "none",
        silent: true,
        label: { fontSize: 9, color: chartTheme.subtext },
        data: [
          {
            yAxis: stable,
            name: "Stable",
            lineStyle: { color: "#6ee7b7", type: "dashed" as const, width: 1 },
          },
          {
            yAxis: unstable,
            name: "Unstable",
            lineStyle: { color: "#f6c453", type: "dashed" as const, width: 1 },
          },
          {
            yAxis: breakAt,
            name: "Break",
            lineStyle: { color: "#f87171", type: "dashed" as const, width: 1 },
          },
        ],
      },
      markArea: {
        silent: true,
        data: [
          [
            { yAxis: 0, itemStyle: { color: "rgba(110, 231, 183, 0.12)" } },
            { yAxis: stable },
          ],
          [
            { yAxis: stable, itemStyle: { color: "rgba(246, 196, 83, 0.1)" } },
            { yAxis: unstable },
          ],
          [
            { yAxis: unstable, itemStyle: { color: "rgba(251, 146, 60, 0.1)" } },
            { yAxis: breakAt },
          ],
          [
            { yAxis: breakAt, itemStyle: { color: "rgba(248, 113, 113, 0.12)" } },
            { yAxis: 105 },
          ],
        ],
      },
    },
  ];

  if (compare && compare.length > 0) {
    series.push({
      type: "line",
      name: "Compare",
      smooth: false,
      showSymbol: false,
      data: compare,
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
    grid: buildCommonGrid(),
    tooltip: {
      ...buildTooltipAxis(),
    },
    legend:
      compare && compare.length > 0
        ? {
            data: ["Build", "Compare"],
            top: 0,
            right: 8,
            textStyle: { color: chartTheme.text, fontSize: 10 },
          }
        : undefined,
    xAxis: {
      type: "value",
      name: "Time (s)",
      min: 0,
      max: 5,
      nameTextStyle: axisNameStyle(),
      axisLabel: axisLabelStyle(),
      splitLine: splitLineStyle(),
    },
    yAxis: {
      type: "value",
      name: "Recoil",
      min: 0,
      max: 105,
      nameTextStyle: axisNameStyle(),
      axisLabel: axisLabelStyle(),
      splitLine: splitLineStyle(),
    },
    series,
  };
}
