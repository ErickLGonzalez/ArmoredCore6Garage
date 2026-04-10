import type { EChartsOption } from "echarts";

import type { EnergyRecoveryCurves } from "@/lib/garage/plot-data";
import {
  axisLabelStyle,
  axisNameStyle,
  buildCommonGrid,
  buildTooltipAxis,
  splitLineStyle,
} from "@/lib/garage/charts/commonOptions";
import { chartTheme } from "@/lib/garage/charts/theme";

function curveToPairs(curve: { t: number[]; en: number[] }): [number, number][] {
  return curve.t.map((t, i) => [t, curve.en[i]!]);
}

export function buildEnergyRecoveryChartOption(
  primary: EnergyRecoveryCurves,
  compare?: EnergyRecoveryCurves | null,
): EChartsOption {
  const primaryNormal = curveToPairs(primary.normal);
  const primaryRed = curveToPairs(primary.redline);

  let delayEnd = Math.max(primary.normal.t[0] ?? 0, primary.redline.t[0] ?? 0);
  if (compare) {
    delayEnd = Math.max(
      delayEnd,
      compare.normal.t[0] ?? 0,
      compare.redline.t[0] ?? 0,
    );
  }

  const compareNormal = compare ? curveToPairs(compare.normal) : null;
  const compareRed = compare ? curveToPairs(compare.redline) : null;

  const series: EChartsOption["series"] = [
    {
      type: "line",
      name: "Normal",
      smooth: false,
      showSymbol: false,
      data: primaryNormal,
      lineStyle: { width: 2.25, color: chartTheme.cyan },
      markArea:
        delayEnd > 0
          ? {
              silent: true,
              itemStyle: { color: "rgba(244, 63, 94, 0.08)" },
              data: [[{ xAxis: 0 }, { xAxis: delayEnd }]],
            }
          : undefined,
    },
    {
      type: "line",
      name: "Redline",
      smooth: false,
      showSymbol: false,
      data: primaryRed,
      lineStyle: { width: 2.25, color: chartTheme.red },
    },
  ];

  if (compareNormal && compareRed) {
    series.push(
      {
        type: "line",
        name: "Compare normal",
        smooth: false,
        showSymbol: false,
        data: compareNormal,
        lineStyle: {
          width: 1.75,
          type: "dashed",
          color: chartTheme.compare,
        },
      },
      {
        type: "line",
        name: "Compare redline",
        smooth: false,
        showSymbol: false,
        data: compareRed,
        lineStyle: {
          width: 1.75,
          type: "dashed",
          color: chartTheme.rose,
        },
      },
    );
  }

  return {
    animationDuration: 220,
    animationDurationUpdate: 180,
    grid: buildCommonGrid(),
    tooltip: {
      ...buildTooltipAxis(),
    },
    legend: {
      top: 0,
      right: 4,
      textStyle: { color: chartTheme.text, fontSize: 9 },
      data: compare
        ? ["Normal", "Redline", "Compare normal", "Compare redline"]
        : ["Normal", "Redline"],
    },
    xAxis: {
      type: "value",
      name: "Time (s)",
      nameTextStyle: axisNameStyle(),
      axisLabel: axisLabelStyle(),
      splitLine: splitLineStyle(),
    },
    yAxis: {
      type: "value",
      name: "EN",
      min: 0,
      nameTextStyle: axisNameStyle(),
      axisLabel: axisLabelStyle(),
      splitLine: splitLineStyle(),
    },
    series,
  };
}
