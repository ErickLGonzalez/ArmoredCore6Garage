/**
 * Mirrors `garage-ui-assets/` → `public/garage-ui/` so Next serves `/garage-ui/*`.
 * Run automatically from `postinstall`; use `node scripts/sync-garage-ui-assets.mjs` after updating assets.
 */

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const src = join(root, "garage-ui-assets");
const dest = join(root, "public", "garage-ui");

if (!existsSync(src)) {
  console.warn("sync-garage-ui-assets: skipped (garage-ui-assets/ not found)");
  process.exit(0);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(join(root, "public"), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("sync-garage-ui-assets: mirrored garage-ui-assets/ → public/garage-ui/");
