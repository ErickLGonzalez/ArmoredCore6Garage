import { describe, expect, it } from "vitest";

import { analyzeBuild } from "@/lib/calc";
import { normalizeRawPart } from "@/lib/data/normalize-part";

describe("analyzeBuild", () => {
  it("sums weight and EN load across slots", () => {
    const a = normalizeRawPart(
      { Name: "A", Kind: "Head", Weight: 1000, ENLoad: 50 },
      0,
      "t.json",
    );
    const b = normalizeRawPart(
      { Name: "B", Kind: "Core", Weight: 2000, ENLoad: 150 },
      1,
      "t.json",
    );
    const r = analyzeBuild({ head: a, core: b });
    expect(r.totalWeight).toBe(3000);
    expect(r.totalEnLoad).toBe(200);
  });
});
