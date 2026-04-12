/**
 * Maps part identity names and manufacturer strings to filenames in
 * `garage-ui-assets/` (served as `/garage-ui/`). Run after changing parts data
 * or asset filenames: `node scripts/generate-part-image-map.mjs`
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const assetDir = join(root, "garage-ui-assets");
const mergedPath = join(root, "data", "parts.merged.json");
const outPath = join(root, "lib", "garage", "part-image-map.generated.json");

const SLOT_UI = new Set([
  "head-DNUrigrV.png",
  "core-B8zPPW4_.png",
  "arms-DqA1k8qI.png",
  "legs-BJMIf3mC.png",
  "rightArm-DHkM81Mo.png",
  "leftArm-BzIzkCFS.png",
  "rightBack-C92IaCpT.png",
  "leftBack-DIMm5nm3.png",
  "booster-yO0tdh-V.png",
  "fcs-Dlc38BId.png",
  "generator-gkpT6ntG.png",
  "expansion-BuLbm5gH.png",
  "sort_ascending-CKKvPke2.png",
  "sort_descending-R6blHvQV.png",
]);

function isPartImageCandidate(file) {
  if (!file.endsWith(".png")) return false;
  if (SLOT_UI.has(file)) return false;
  if (file.startsWith("sort_")) return false;
  if (file.startsWith("index-")) return false;
  return true;
}

function normalizeKey(s) {
  return s.replace(/:/g, " ").replace(/\s+/g, " ").trim().replace(/\s/g, "_");
}

function pickShortest(files) {
  return [...files].sort((a, b) => a.length - b.length)[0] ?? null;
}

const files = readdirSync(assetDir).filter(isPartImageCandidate);
const merged = JSON.parse(readFileSync(mergedPath, "utf8"));
const used = new Set();

const partImageByName = {};
for (const p of merged.parts) {
  const name = p.identity.name;
  const prefix = normalizeKey(name);
  const hits = files.filter(
    (f) => !used.has(f) && (f.startsWith(`${prefix}-`) || f === `${prefix}.png`),
  );
  const best = pickShortest(hits);
  if (best) {
    partImageByName[name] = best;
    used.add(best);
  }
}

const manufacturers = [
  ...new Set(merged.parts.map((p) => p.identity.manufacturer).filter(Boolean)),
].sort((a, b) => b.length - a.length);

const manufacturerImageByName = {};
for (const m of manufacturers) {
  const prefix = normalizeKey(m);
  const hits = files.filter(
    (f) => !used.has(f) && (f.startsWith(`${prefix}-`) || f === `${prefix}.png`),
  );
  const best = pickShortest(hits);
  if (best) {
    manufacturerImageByName[m] = best;
    used.add(best);
  }
}

writeFileSync(
  outPath,
  `${JSON.stringify({ partImageByName, manufacturerImageByName }, null, 2)}\n`,
  "utf8",
);
console.log(
  `generate-part-image-map: ${Object.keys(partImageByName).length} parts, ${Object.keys(manufacturerImageByName).length} manufacturers → ${outPath}`,
);
