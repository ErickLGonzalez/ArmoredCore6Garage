# MasterofArena milestone plan

Order: **M1 → M2 → M3 → M4+ → full garage UI → polish / deploy**.

| Milestone | Scope | Status |
|-----------|--------|--------|
| **M1** | Next.js App Router, TS, Tailwind, Prisma + PostgreSQL wiring | Done |
| **M2** | Zod schemas, `normalizeRawPart`, `import-parts.ts` → `parts.merged.json`, Vitest, spreadsheet overrides ([SPREADSHEET.md](./SPREADSHEET.md)) | Done |
| **M3** | Legacy postprocess (`postprocessLegacyDataset`), `computeAllStats` port, `analyzeBuild` / `REQUIRED_ASSEMBLY_SLOTS` | Done |
| **M4+** | Accuracy layer: recoil sim (from M3), **FCS assist vs distance** (legacy plot breakpoints), composed preview `computeFullAccuracy` | In progress |
| **UI v1** | `/garage` slot pickers + `BuildAnalysis` summary + legacy stat groups | Done (preview) |
| **UI v2** | SVG Range/Recoil plots, compare builds + overlay, expansion in calc + picker, `?b` / `?b2` URL state | Done (first pass) |
| **Polish** | A11y, mobile, perf, golden tests vs legacy snapshots | Planned |

## Current focus

1. Extend **M4** with data-driven helpers (FCS curve parity, documented heuristics for DPS preview).
2. Grow **UI v2** toward legacy `StatRows` / plot behavior.
