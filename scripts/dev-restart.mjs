/**
 * Free port 3000 (best-effort) and start Next dev (Turbopack, :3000).
 * Spawns `next/dist/bin/next` via Node (no `shell: true` + npm) to avoid DEP0190.
 * Windows: unique listener PIDs only (never PID 0); optional second pass after a short delay
 * if listeners are still bound (race with process teardown).
 * Other: lsof + kill.
 */
import { execSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

function freePort3000() {
  if (process.platform === "win32") {
    try {
      execSync(
        'powershell -NoProfile -Command "' +
          "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | " +
          "ForEach-Object { $_.OwningProcess } | Sort-Object -Unique | " +
          "Where-Object { $_ -gt 0 } | " +
          "ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }",
        { stdio: "inherit" },
      );
      console.log("Freed port 3000 (best-effort).");
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    execSync("lsof -ti:3000 | xargs kill -9 2>/dev/null", { shell: true, stdio: "pipe" });
  } catch {
    /* ignore */
  }
}

function windowsListenCount3000() {
  if (process.platform !== "win32") return 0;
  try {
    const out = execSync(
      'powershell -NoProfile -Command "' +
        "@(Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue).Count" +
        '"',
      { encoding: "utf8" },
    ).trim();
    const n = Number(out);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function startNextDev() {
  const require = createRequire(import.meta.url);
  let nextBin;
  try {
    nextBin = require.resolve("next/dist/bin/next");
  } catch {
    nextBin = null;
  }

  const child = nextBin
    ? spawn(process.execPath, [nextBin, "dev", "--turbopack", "-p", "3000"], {
        stdio: "inherit",
        cwd: process.cwd(),
        shell: false,
      })
    : spawn("npm", ["run", "dev:server"], {
        stdio: "inherit",
        cwd: process.cwd(),
        shell: true,
      });

  child.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}

async function main() {
  freePort3000();
  if (process.platform === "win32" && windowsListenCount3000() > 0) {
    console.log("Port 3000 still has listeners; waiting 450ms and retrying kill…");
    await delay(450);
    freePort3000();
  }
  startNextDev();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
