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
