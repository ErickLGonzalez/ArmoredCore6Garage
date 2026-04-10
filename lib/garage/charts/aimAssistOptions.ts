import type { EChartsOption } from "echarts";

import {
  axisLabelStyle,
  axisNameStyle,
  buildCommonGrid,
  buildTooltipAxis,
  splitLineStyle,
} from "@/lib/garage/charts/commonOptions";
import { chartTheme } from "@/lib/garage/charts/theme";

export function aimAssistPolylineFromRow(row: number[]): [number, number][] | null {
  if (
    row.length < 7 ||
    ![row[4], row[5], row[6]].every((n) => Number.isFinite(Number(n)))
  ) {
    return null;
  }
  return assistPoints(Number(row[4]), Number(row[5]), Number(row[6]));
}

function assistPoints(close: number, medium: number, long: number): [number, number][] {
  return [
    [0, close],
    [120, close],
    [140, medium],
    [250, medium],
    [270, long],
    [320, long],
  ];
}

function weaponIdealXs(row: number[]): number[] {
  const [ra, la, rb, lb] = row;
  return [ra, la, rb, lb]
    .map((r) =>
      r != null && Number.isFinite(Number(r)) ? Math.min(Number(r), 300) : null,
    )
    .filter((x): x is number => x != null);
}

/** FCS aim assist vs distance (legacy seven-value row) + optional compare. */
export function buildAimAssistChartOption(
  primary: number[],
  compare?: number[] | null,
): EChartsOption {
  const c = primary[4] ?? 0;
  const m = primary[5] ?? 0;
  const l = primary[6] ?? 0;
  const primaryPts = assistPoints(c, m, l);

  const compareOk =
    compare &&
    compare.length >= 7 &&
    [compare[4], compare[5], compare[6]].every((n) => Number.isFinite(Number(n)));
  const comparePts = compareOk
    ? assistPoints(Number(compare![4]), Number(compare![5]), Number(compare![6]))
    : null;

  const weaponXs = weaponIdealXs(primary);
  const markLineData = weaponXs.map((x) => ({
    xAxis: x,
    lineStyle: { color: chartTheme.red, width: 1.5, type: "solid" as const },
    label: { show: false },
  }));

  const series: EChartsOption["series"] = [
    {
      type: "line",
      name: "Build",
      smooth: true,
      showSymbol: false,
      data: primaryPts,
      lineStyle: { width: 2.5, color: chartTheme.cyan },
      areaStyle: {
        color: "rgba(34, 211, 238, 0.12)",
      },
      markLine: {
        symbol: "none",
        silent: true,
        data: markLineData,
      },
      markArea: {
        silent: true,
        itemStyle: { opacity: 0.12, color: chartTheme.cyan },
        data: [
          [{ xAxis: 0, name: "Close" }, { xAxis: 120 }],
          [{ xAxis: 140, name: "Mid" }, { xAxis: 250 }],
          [{ xAxis: 270, name: "Long" }, { xAxis: 320 }],
        ],
      },
    },
  ];

  if (comparePts) {
    series.push({
      type: "line",
      name: "Compare",
      smooth: true,
      showSymbol: false,
      data: comparePts,
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
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const first = list[0];
        if (!first || !Array.isArray(first.value)) return "";
        const [dist] = first.value as [number, number];
        const rows = [`<div><b>${dist} m</b></div>`];
        for (const p of list) {
          if (Array.isArray(p.value)) {
            const [, y] = p.value as [number, number];
            rows.push(
              `<div>${String(p.seriesName)}: ${typeof y === "number" ? y.toFixed(1) : y}</div>`,
            );
          }
        }
        return rows.join("");
      },
    },
    legend: comparePts
      ? {
          data: ["Build", "Compare"],
          top: 0,
          right: 8,
          textStyle: { color: chartTheme.text, fontSize: 10 },
        }
      : undefined,
    xAxis: {
      type: "value",
      name: "Distance (m)",
      min: 0,
      max: 320,
      nameTextStyle: axisNameStyle(),
      axisLabel: axisLabelStyle(),
      splitLine: splitLineStyle(),
    },
    yAxis: {
      type: "value",
      name: "Assist",
      min: 0,
      max: 95,
      nameTextStyle: axisNameStyle(),
      axisLabel: axisLabelStyle(),
      splitLine: splitLineStyle(),
    },
    series,
  };
}
