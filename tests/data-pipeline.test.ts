import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { normalizeRawPart } from "@/lib/data/normalize-part";
import { CanonicalPartSchema, MergedDatasetSchema } from "@/lib/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "data", "source", "parts.json");
const MERGED = path.join(ROOT, "data", "parts.merged.json");

describe("full PartsData pipeline", () => {
  it("keeps merged visible/base stats synced with 1.0.9 source", () => {
    if (!existsSync(SOURCE) || !existsSync(MERGED)) {
      console.warn("skip: missing source or merged data");
      return;
    }
    const srcRaw = JSON.parse(readFileSync(SOURCE, "utf-8")) as Record<string, unknown>[];
    const sourceByName = new Map(
      srcRaw.map((r, i) => {
        const n = normalizeRawPart(r, i, "data/source/parts.json");
        return [n.identity.name, n] as const;
      }),
    );
    const merged = MergedDatasetSchema.parse(JSON.parse(readFileSync(MERGED, "utf-8")));
    for (const p of merged.parts) {
      if (p.identity.name === "(NOTHING)") continue;
      const source = sourceByName.get(p.identity.name);
      expect(source, `missing source part for ${p.identity.name}`).toBeTruthy();
      if (!source) continue;
      for (const key of Object.keys(source.baseStats)) {
        expect(
          p.baseStats[key as keyof typeof p.baseStats],
          `${p.identity.name}.${key}`,
        ).toEqual(source.baseStats[key as keyof typeof source.baseStats]);
      }
    }
  });

  it("normalizes and validates every row when source exists", () => {
    if (!existsSync(SOURCE)) {
      console.warn("skip: data/source/parts.json missing");
      return;
    }
    const raw: unknown = JSON.parse(readFileSync(SOURCE, "utf-8"));
    expect(Array.isArray(raw)).toBe(true);
    const arr = raw as Record<string, unknown>[];
    expect(arr.length).toBeGreaterThan(200);

    for (let i = 0; i < arr.length; i++) {
      const n = normalizeRawPart(arr[i]!, i, "data/source/parts.json");
      const r = CanonicalPartSchema.safeParse(n);
      expect(r.success, `row ${i} ${arr[i]?.Name}`).toBe(true);
    }
  });

  it("validates parts.merged.json when present", () => {
    if (!existsSync(MERGED)) {
      console.warn("skip: run npm run data:merge first");
      return;
    }
    const data: unknown = JSON.parse(readFileSync(MERGED, "utf-8"));
    const r = MergedDatasetSchema.safeParse(data);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.partCount).toBe(r.data.parts.length);
      expect(r.data.partCount).toBe(234);
      const known = new Set(r.data.parts.map((p) => p.identity.name));
      expect(known.has("RF-024 TURNER")).toBe(true);
      expect(known.has("HC-2000 FINDER EYE")).toBe(true);
      expect(known.has("(NOTHING)")).toBe(true);
      for (const p of r.data.parts) {
        expect(p.metadata.patchVersion).toBe("1.0.9");
        expect(p.metadata.sourceVersion).toBe("repo-1.0.9");
        expect(p.metadata.spreadsheetVersion).toBe("1.0.7");
        expect(Array.isArray(p.metadata.overrideSources)).toBe(true);
      }
    }
  });
});
