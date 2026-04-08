/**
 * Apply spreadsheet / CSV overrides onto data/parts.merged.json (by part name).
 *
 * CSV format (header row required):
 *   partName,field,value
 *   RF-024 TURNER,AttackPower,1400
 *
 * Usage:
 *   npx tsx scripts/merge-spreadsheet.ts --input data/source/overrides.csv
 *   npx tsx scripts/merge-spreadsheet.ts --input overrides.json  (array of {partName,field,value})
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CanonicalPartSchema, MergedDatasetSchema } from "@/lib/schema";
import { SpreadsheetOverrideFileSchema } from "@/lib/schema/spreadsheet-override";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MERGED = path.join(ROOT, "data", "parts.merged.json");

function parseArgs(): { input: string } {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf("--input");
  if (idx < 0 || !argv[idx + 1]) {
    console.error("Usage: merge-spreadsheet --input <file.csv|file.json>");
    process.exit(1);
  }
  return { input: path.resolve(argv[idx + 1]!) };
}

/** RFC-style CSV row: commas inside quoted fields, doubled quotes for escape. */
function splitCsvRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && c === ",") {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

function unquoteCell(s: string): string {
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/""/g, '"').trim();
  }
  return s.trim();
}

function parseCsv(text: string): unknown[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const header = splitCsvRow(lines[0]!).map((s) => unquoteCell(s).toLowerCase());
  const iName = header.indexOf("partname");
  const iField = header.indexOf("field");
  const iVal = header.indexOf("value");
  if (iName < 0 || iField < 0 || iVal < 0) {
    throw new Error("CSV must have columns: partName, field, value");
  }
  const rows: unknown[] = [];
  for (let li = 1; li < lines.length; li++) {
    const cols = splitCsvRow(lines[li]!).map(unquoteCell);
    if (cols.length < 3) continue;
    const rawVal = cols[iVal]!;
    let value: string | number | boolean = rawVal;
    if (rawVal === "true") value = true;
    else if (rawVal === "false") value = false;
    else if (!Number.isNaN(Number(rawVal)) && rawVal !== "") {
      value = Number(rawVal);
    }
    rows.push({
      partName: cols[iName]!,
      field: cols[iField]!,
      value,
    });
  }
  return rows;
}

function main() {
  const { input } = parseArgs();
  const ext = path.extname(input).toLowerCase();
  const rawText = readFileSync(input, "utf-8");
  let rowsParsed: unknown;
  if (ext === ".csv") {
    rowsParsed = parseCsv(rawText);
  } else {
    rowsParsed = JSON.parse(rawText);
  }

  const overrides = SpreadsheetOverrideFileSchema.parse(rowsParsed);

  const mergedJson = JSON.parse(readFileSync(MERGED, "utf-8"));
  const dataset = MergedDatasetSchema.parse(mergedJson);

  const byName = new Map(
    dataset.parts.map((p) => [p.identity.name, p] as const),
  );

  for (const row of overrides) {
    const part = byName.get(row.partName);
    if (!part) {
      console.warn(`Unknown partName (skipped): ${row.partName}`);
      continue;
    }
    const next = {
      ...part,
      baseStats: { ...part.baseStats, [row.field]: row.value },
      metadata: {
        ...part.metadata,
        schemaVersion: "1.0.0" as const,
        patchVersion: "1.0.9" as const,
        sourceVersion: "repo-1.0.9" as const,
        spreadsheetVersion: "1.0.7" as const,
        overrideSources: Array.from(
          new Set([...(part.metadata.overrideSources ?? []), "spreadsheet-override"]),
        ),
      },
    };
    const checked = CanonicalPartSchema.safeParse(next);
    if (!checked.success) {
      console.warn(
        `Override invalid for ${row.partName}.${row.field}:`,
        checked.error.flatten(),
      );
      continue;
    }
    byName.set(row.partName, checked.data);
  }

  const nextDataset = {
    ...dataset,
    parts: dataset.parts.map((p) => byName.get(p.identity.name) ?? p),
    generatedAt: new Date().toISOString(),
  };

  writeFileSync(MERGED, JSON.stringify(nextDataset, null, 2), "utf-8");
  console.log(`Applied ${overrides.length} override(s) → ${MERGED}`);
}

main();
