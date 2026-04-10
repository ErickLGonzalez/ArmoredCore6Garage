import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeRawPart } from "@/lib/data/normalize-part";
import { MergedDatasetSchema } from "@/lib/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MERGED = path.join(ROOT, "data", "parts.merged.json");
const SOURCE = path.join(ROOT, "data", "source", "parts.json");

function sameStatValue(a: unknown, b: unknown): boolean {
  if (typeof a === "number" || typeof b === "number") {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
    return Math.abs(na - nb) < 1e-9;
  }
  return a === b;
}

function main() {
  const raw = JSON.parse(readFileSync(MERGED, "utf-8"));
  const parsed = MergedDatasetSchema.parse(raw);

  if (parsed.partCount !== parsed.parts.length) {
    throw new Error(
      `Invalid dataset: partCount=${parsed.partCount} but parts.length=${parsed.parts.length}`,
    );
  }

  const badPatch = parsed.parts.filter((p) => p.metadata.patchVersion !== "1.0.9");
  if (badPatch.length > 0) {
    throw new Error(`Invalid patchVersion on ${badPatch.length} part(s). Expected 1.0.9.`);
  }

  const sourceRaw = JSON.parse(readFileSync(SOURCE, "utf-8")) as Record<string, unknown>[];
  const normalizedByName = new Map(
    sourceRaw.map((raw, i) => {
      const p = normalizeRawPart(raw, i, "data/source/parts.json");
      return [p.identity.name, p] as const;
    }),
  );
  const mismatches: string[] = [];
  for (const part of parsed.parts) {
    if (part.identity.name === "(NOTHING)") continue;
    const source = normalizedByName.get(part.identity.name);
    if (!source) {
      mismatches.push(`missing-source:${part.identity.name}`);
      continue;
    }
    for (const key of Object.keys(source.baseStats)) {
      const a = (source.baseStats as Record<string, unknown>)[key];
      const b = (part.baseStats as Record<string, unknown>)[key];
      if (!sameStatValue(a, b)) {
        mismatches.push(`${part.identity.name}.${key}`);
        if (mismatches.length >= 25) break;
      }
    }
    if (mismatches.length >= 25) break;
  }
  if (mismatches.length > 0) {
    throw new Error(
      `Visible/base stat drift from canonical source detected (${mismatches.length} sample mismatches): ${mismatches.join(", ")}`,
    );
  }

  console.log(
    `Validated ${parsed.parts.length} parts (schema=${parsed.schemaVersion}, patch=1.0.9, canonical visible/base stats match source)`,
  );
}

main();
