import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MergedDatasetSchema } from "@/lib/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MERGED = path.join(ROOT, "data", "parts.merged.json");

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

  console.log(
    `Validated ${parsed.parts.length} parts (schema=${parsed.schemaVersion}, patch=1.0.9)`,
  );
}

main();
