/**
 * Mirrors `garage-ui-assets/` → `public/garage-ui/` (React garage) and
 * `public/assets/` (legacy Vite bundle expects `/assets/*`).
 * Run from `postinstall` or: `node scripts/sync-garage-ui-assets.mjs`
 */

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const src = join(root, "garage-ui-assets");
const destGarageUi = join(root, "public", "garage-ui");
const destLegacyAssets = join(root, "public", "assets");

if (!existsSync(src)) {
  console.warn("sync-garage-ui-assets: skipped (garage-ui-assets/ not found)");
  process.exit(0);
}

mkdirSync(join(root, "public"), { recursive: true });

rmSync(destGarageUi, { recursive: true, force: true });
cpSync(src, destGarageUi, { recursive: true });

rmSync(destLegacyAssets, { recursive: true, force: true });
cpSync(src, destLegacyAssets, { recursive: true });

console.log(
  "sync-garage-ui-assets: mirrored garage-ui-assets/ → public/garage-ui/ and public/assets/",
);
