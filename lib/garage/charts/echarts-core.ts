import * as echarts from "echarts/core";
import { BarChart, HeatmapChart, LineChart, RadarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
  RadarComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { UniversalTransition } from "echarts/features";

echarts.use([
  BarChart,
  LineChart,
  RadarChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
  RadarComponent,
  VisualMapComponent,
  CanvasRenderer,
  UniversalTransition,
]);

export { echarts };
