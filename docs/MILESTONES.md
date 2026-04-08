# MasterofArena milestone plan

Order: **M1 → M2 → M3 → M4+ → full garage UI → polish / deploy**.

| Milestone | Scope | Status |
|-----------|--------|--------|
| **M1** | Next.js App Router, TS, Tailwind, Prisma + PostgreSQL wiring | Done |
| **M2** | Zod schemas, `normalizeRawPart`, `import-parts.ts` → `parts.merged.json`, Vitest, spreadsheet overrides ([SPREADSHEET.md](./SPREADSHEET.md)) | Done |
| **M3** | Legacy postprocess (`postprocessLegacyDataset`), `computeAllStats` port, `analyzeBuild` / `REQUIRED_ASSEMBLY_SLOTS` | Done |
| **M4+** | Accuracy layer: recoil sim (from M3), **FCS assist vs distance** (legacy plot breakpoints), composed preview `computeFullAccuracy` | Done |
| **UI v1** | `/garage` slot pickers + `BuildAnalysis` summary + legacy stat groups | Done (preview) |
| **UI v2** | SVG Range/Recoil/**EN recovery** plots, compare builds + overlay, expansion in calc + picker, `?b` / `?b2` URL state, dual legacy stat panels when comparing | Done |
| **Polish** | A11y (skip link, focus rings, labeled slot pickers), golden tests (`starter-build-golden.test.ts`), quoted-field CSV overrides | Done (first pass) |

## Current focus

Ship polish follow-ups as needed (mobile layout tuning, perf, optional stricter legacy snapshot diffs).
