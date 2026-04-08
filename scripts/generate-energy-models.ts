import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MergedDatasetSchema } from "@/lib/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MERGED = path.join(ROOT, "data", "parts.merged.json");
const OUTPUT = path.join(ROOT, "data", "generated", "energy-models.json");

type StubEnergyModel = {
  kind: string;
  source: "stub";
  coefficients: [number, number, number, number];
  note: string;
};

function main() {
  const raw = readFileSync(MERGED, "utf-8");
  const ds = MergedDatasetSchema.parse(JSON.parse(raw));
  const kinds = Array.from(new Set(ds.parts.map((p) => p.identity.kind))).sort();
  const models: StubEnergyModel[] = kinds.map((kind) => ({
    kind,
    source: "stub",
    coefficients: [0, 0, 0, 1],
    note: "Placeholder model. Replace with calibrated 3rd-order regression.",
  }));

  mkdirSync(path.dirname(OUTPUT), { recursive: true });
  writeFileSync(
    OUTPUT,
    JSON.stringify(
      {
        schemaVersion: "1.0.0",
        generatedAt: new Date().toISOString(),
        patchVersion: "1.0.9",
        modelCount: models.length,
        models,
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log(`Wrote ${models.length} energy model stubs → ${path.relative(ROOT, OUTPUT)}`);
}

main();
