import { describe, expect, it } from "vitest";

import { normalizeRawPart } from "@/lib/data/normalize-part";
import { CanonicalPartSchema, MergedDatasetSchema } from "@/lib/schema";

describe("CanonicalPartSchema", () => {
  it("accepts a normalized unit", () => {
    const raw = {
      Name: "44-141 JVLN ALPHA",
      Kind: "Unit",
      Manufacturer: "ALLMIND",
      Description: "Detonating Bazooka",
      AttackPower: 1375,
      Weight: 5920,
      ENLoad: 299,
    };
    const n = normalizeRawPart(raw, 0, "fixture.json");
    const r = CanonicalPartSchema.safeParse(n);
    expect(r.success).toBe(true);
  });

  it("accepts charge-style scaling fields", () => {
    const raw = {
      Name: "Test Charge",
      Kind: "Unit",
      ChgAttackPower: 100,
      FullChgAttackPower: 200,
      Weight: 1,
      ENLoad: 1,
    };
    const n = normalizeRawPart(raw, 0, "fixture.json");
    expect(n.scalingModels.ChgAttackPower).toBe(100);
    expect(n.baseStats.Weight).toBe(1);
    expect(CanonicalPartSchema.safeParse(n).success).toBe(true);
  });
});

describe("MergedDatasetSchema", () => {
  it("accepts minimal dataset", () => {
    const part = normalizeRawPart(
      { Name: "A", Kind: "Head", Weight: 0, ENLoad: 0 },
      0,
      "t.json",
    );
    const ds = {
      schemaVersion: "1.0.0" as const,
      generatedAt: new Date().toISOString(),
      source: "t.json",
      partCount: 1,
      parts: [CanonicalPartSchema.parse(part)],
    };
    expect(MergedDatasetSchema.safeParse(ds).success).toBe(true);
  });
});
