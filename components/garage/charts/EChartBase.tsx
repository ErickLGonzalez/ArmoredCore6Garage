"use client";

import type { EChartsOption } from "echarts";
import EChartsReactCore from "echarts-for-react/lib/core";

import { echarts } from "@/lib/garage/charts/echarts-core";

type EChartBaseProps = {
  option: EChartsOption;
  height?: number;
  loading?: boolean;
  className?: string;
};

export function EChartBase({
  option,
  height = 200,
  loading,
  className,
}: EChartBaseProps) {
  return (
    <div
      className={className}
      style={{ width: "100%" }}
    >
      <EChartsReactCore
        echarts={echarts}
        option={option}
        notMerge={false}
        lazyUpdate
        showLoading={loading}
        style={{ height, width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
}
