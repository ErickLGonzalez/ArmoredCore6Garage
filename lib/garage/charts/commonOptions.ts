import { chartTheme } from "@/lib/garage/charts/theme";

export function buildCommonGrid() {
  return {
    top: 32,
    right: 16,
    bottom: 28,
    left: 48,
    containLabel: true,
  };
}

export function buildTooltipAxis() {
  return {
    trigger: "axis" as const,
    backgroundColor: "rgba(9, 12, 18, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.25)",
    textStyle: { color: "#e4e4e7", fontSize: 11 },
    extraCssText:
      "border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.35);",
  };
}

export function axisLabelStyle() {
  return { color: chartTheme.subtext, fontSize: 10 };
}

export function axisNameStyle() {
  return { color: chartTheme.text, fontSize: 11 };
}

export function splitLineStyle() {
  return { lineStyle: { color: chartTheme.grid, type: "solid" as const } };
}
