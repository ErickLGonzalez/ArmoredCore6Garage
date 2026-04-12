import { describe, expect, it } from "vitest";

import { buildDefensiveBarsChartOption } from "@/lib/garage/charts/defensiveBars.options";
import { buildDefensiveRadarChartOption } from "@/lib/garage/charts/defensiveRadar.options";
import type { DefensiveRadarRaw } from "@/lib/garage/charts/dashboard-types";

const sample: DefensiveRadarRaw = {
  ap: 2200,
  effectiveAp: 1800,
  stability: 420,
  kineticDef: 210,
  energyDef: 195,
  explosiveDef: 188,
};

describe("buildDefensiveBarsChartOption", () => {
  it("includes Build bar series and hides legend when solo", () => {
    const opt = buildDefensiveBarsChartOption(sample, null);
    const series = opt.series as { type?: string; name?: string }[];
    expect(series.some((s) => s.type === "bar" && s.name === "Build")).toBe(true);
    expect(series.some((s) => s.name === "Backplate")).toBe(true);
    expect((opt.legend as { show?: boolean })?.show).toBe(false);
    const yMax = (opt.yAxis as { max?: number })?.max;
    expect(typeof yMax).toBe("number");
    expect(yMax!).toBeGreaterThan(0);
  });

  it("adds Compare series and legend when comparing", () => {
    const other: DefensiveRadarRaw = { ...sample, ap: 1900, kineticDef: 240 };
    const opt = buildDefensiveBarsChartOption(sample, other);
    const series = opt.series as { type?: string; name?: string }[];
    expect(series.some((s) => s.name === "Compare")).toBe(true);
    expect((opt.legend as { data?: string[] })?.data).toEqual([
      "Build",
      "Compare",
    ]);
  });
});

describe("buildDefensiveRadarChartOption", () => {
  it("returns radar series with Build polygon", () => {
    const opt = buildDefensiveRadarChartOption(sample, null);
    expect((opt.series as { type?: string }[])[0]?.type).toBe("radar");
    const data = (opt.series as { data?: { name?: string }[] }[])[0]?.data;
    expect(data?.[0]?.name).toBe("Build");
  });
});
