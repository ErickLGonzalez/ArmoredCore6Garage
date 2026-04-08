/**
 * MasterofArena — merge legacy AC6 PartsData.json into validated data/parts.merged.json
 *
 * Usage:
 *   npx tsx scripts/import-parts.ts
 *   npx tsx scripts/import-parts.ts --input path/to/parts.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { postprocessLegacyDataset } from "@/lib/calc/postprocess";
import type { LegacyPart } from "@/lib/calc/types";
import { normalizeRawPart } from "@/lib/data/normalize-part";
import { CanonicalPartSchema, MergedDatasetSchema } from "@/lib/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_INPUT = path.join(ROOT, "data", "source", "parts.json");
const OUTPUT = path.join(ROOT, "data", "parts.merged.json");

function parseArgs(): { input: string } {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf("--input");
  if (idx >= 0 && argv[idx + 1]) {
    return { input: path.resolve(argv[idx + 1]!) };
  }
  return { input: DEFAULT_INPUT };
}

function main() {
  const { input } = parseArgs();
  const rawJson = readFileSync(input, "utf-8");
  const parsed: unknown = JSON.parse(rawJson);
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected JSON array in ${input}`);
  }

  const relSource = path.relative(ROOT, input).replace(/\\/g, "/");
  const parts: ReturnType<typeof normalizeRawPart>[] = [];
  const errors: string[] = [];

  const legacyInput: LegacyPart[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const row = parsed[i];
    if (row === null || typeof row !== "object" || Array.isArray(row)) {
      errors.push(`Index ${i}: expected object`);
      continue;
    }
    legacyInput.push(row as LegacyPart);
  }

  if (errors.length > 0) {
    console.error("Validation errors:\n", errors.slice(0, 20).join("\n"));
    process.exit(1);
  }

  const processed = postprocessLegacyDataset(legacyInput);

  for (let i = 0; i < processed.length; i++) {
    const row = processed[i]!;
    try {
      const normalized = normalizeRawPart(
        row as Record<string, unknown>,
        i,
        relSource,
      );
      const checked = CanonicalPartSchema.safeParse(normalized);
      if (!checked.success) {
        errors.push(`Index ${i}: ${checked.error.message}`);
        continue;
      }
      parts.push(checked.data);
    } catch (e) {
      errors.push(`Index ${i}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (errors.length > 0) {
    console.error("Validation errors:\n", errors.slice(0, 20).join("\n"));
    if (errors.length > 20) console.error(`... and ${errors.length - 20} more`);
    process.exit(1);
  }

  const dataset = {
    schemaVersion: "1.0.0" as const,
    generatedAt: new Date().toISOString(),
    source: relSource,
    partCount: parts.length,
    parts,
  };

  const merged = MergedDatasetSchema.safeParse(dataset);
  if (!merged.success) {
    console.error(merged.error.flatten());
    process.exit(1);
  }

  writeFileSync(OUTPUT, JSON.stringify(merged.data, null, 2), "utf-8");
  console.log(`Wrote ${parts.length} parts to ${path.relative(ROOT, OUTPUT)}`);
}

main();
