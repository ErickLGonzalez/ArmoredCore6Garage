/**
 * Fetches origin, tracks remote branch tips in .git/moa-remote-sync.json,
 * and reports new or updated branches for parallel / multi-agent workflows.
 *
 * CLI: node scripts/git-sync-remote.mjs
 * Cursor hook: node scripts/git-sync-remote.mjs --cursor-hook
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const STATE = "moa-remote-sync.json";

function repoRoot() {
  return process.env.CURSOR_PROJECT_DIR || process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

function git(cwd, args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: 10 * 1024 * 1024,
  }).trimEnd();
}

function readStdinUtf8() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function loadState(gitDir) {
  const p = join(gitDir, STATE);
  if (!existsSync(p)) return { refs: {} };
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return { refs: {} };
  }
}

function saveState(gitDir, refs) {
  writeFileSync(join(gitDir, STATE), JSON.stringify({ refs }, null, 2), "utf8");
}

function listRemoteRefs(cwd) {
  const out = git(cwd, [
    "for-each-ref",
    "--format=%(refname:short)\t%(objectname)",
    "refs/remotes/origin",
  ]);
  const refs = {};
  for (const line of out.split("\n")) {
    if (!line) continue;
    const [short, sha] = line.split("\t");
    if (!short || !sha) continue;
    if (short === "origin" || short === "origin/HEAD") continue;
    refs[short] = sha;
  }
  return refs;
}

function runSync(cwd) {
  const gitDir = join(cwd, ".git");
  if (!existsSync(gitDir)) {
    return {
      ok: false,
      message: "Not a git repository; skipped remote sync.",
      lines: [],
      context: "",
    };
  }

  let fetchErr = "";
  try {
    git(cwd, ["fetch", "origin", "--prune"]);
  } catch (e) {
    fetchErr = e instanceof Error ? e.message : String(e);
  }

  if (fetchErr) {
    return {
      ok: false,
      message: fetchErr,
      lines: [`git fetch failed: ${fetchErr}`],
      context: `[git sync] fetch failed: ${fetchErr}`,
    };
  }

  const prev = loadState(gitDir);
  const prevRefs = prev.refs && typeof prev.refs === "object" ? prev.refs : {};
  const nextRefs = listRemoteRefs(cwd);
  saveState(gitDir, nextRefs);

  const lines = [];
  const updates = [];

  for (const [name, sha] of Object.entries(nextRefs)) {
    const old = prevRefs[name];
    if (old === undefined) {
      lines.push(`  new branch  ${name} @ ${sha.slice(0, 7)}`);
      updates.push(`${name} (new) → ${sha.slice(0, 7)}`);
    } else if (old !== sha) {
      lines.push(`  updated     ${name} ${old.slice(0, 7)} → ${sha.slice(0, 7)}`);
      updates.push(`${name} ${old.slice(0, 7)} → ${sha.slice(0, 7)}`);
    }
  }

  const deleted = Object.keys(prevRefs).filter((k) => nextRefs[k] === undefined);
  for (const name of deleted) {
    lines.push(`  removed ref ${name} (pruned or renamed)`);
  }

  const header = "[git sync] origin fetched.";
  let context = header;
  if (updates.length) {
    context += ` Remote updates: ${updates.join("; ")}. Consider: git fetch origin && git merge <branch> (or rebase) before editing overlapping files.`;
  }
  if (deleted.length) {
    context += ` Remote branches removed after fetch --prune: ${deleted.join(", ")}. If you had a local branch tracking one of these, update or delete it as needed.`;
  }
  if (updates.length === 0 && deleted.length === 0) {
    context += " No new commits detected on tracked remote branches since last sync.";
  }

  if (lines.length || deleted.length) {
    return {
      ok: true,
      message: "fetch ok",
      lines: [header, ...lines],
      context,
    };
  }

  return {
    ok: true,
    message: "fetch ok",
    lines: [header, "  (no tip changes since last run)"],
    context,
  };
}

function isStopPayload(input) {
  return (
    input &&
    typeof input === "object" &&
    typeof input.status === "string" &&
    typeof input.loop_count === "number"
  );
}

function isSessionStartPayload(input) {
  return input && typeof input === "object" && typeof input.session_id === "string";
}

function hookMain() {
  const raw = readStdinUtf8();
  let input = {};
  if (raw.trim()) {
    try {
      input = JSON.parse(raw);
    } catch {
      input = {};
    }
  }

  const cwd = repoRoot();
  const result = runSync(cwd);

  if (isStopPayload(input)) {
    process.stdout.write("{}\n");
    if (result.lines.length) {
      console.error(result.lines.join("\n"));
    }
    process.exit(0);
    return;
  }

  if (isSessionStartPayload(input)) {
    const out = {
      additional_context: result.context || result.message || "",
    };
    process.stdout.write(`${JSON.stringify(out)}\n`);
    if (result.lines.length) {
      console.error(result.lines.join("\n"));
    }
    process.exit(0);
    return;
  }

  process.stdout.write("{}\n");
  if (result.lines.length) {
    console.error(result.lines.join("\n"));
  }
  process.exit(0);
}

function cliMain() {
  const cwd = repoRoot();
  const result = runSync(cwd);
  for (const line of result.lines) {
    console.log(line);
  }
  if (!result.ok) {
    process.exitCode = 1;
  }
}

const argv = process.argv.slice(2);
if (argv.includes("--cursor-hook")) {
  hookMain();
} else {
  cliMain();
}
