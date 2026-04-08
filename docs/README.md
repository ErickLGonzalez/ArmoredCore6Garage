# MasterofArena documentation

Implementation follows the milestone plan (foundation → data pipeline → calc engine → M4+ → UI → …). See **[MILESTONES.md](./MILESTONES.md)** for the checklist and current focus.
Cursor pack execution/state is tracked in **[CURSOR_PACK_STATUS.md](./CURSOR_PACK_STATUS.md)**.
Repo merge checklist progress is tracked in **[REPO_MERGE_CHECKLIST_STATUS.md](./REPO_MERGE_CHECKLIST_STATUS.md)**.

- **Milestone 1:** Next.js App Router, TypeScript, Tailwind, Prisma + PostgreSQL wiring, Vercel-ready.
- **Milestone 2:** Zod schemas (`lib/schema`), normalization (`lib/data`), `scripts/import-parts.ts` → `data/parts.merged.json`, Vitest coverage. **Spreadsheet overrides:** see [SPREADSHEET.md](./SPREADSHEET.md) and `npm run data:merge:sheet -- --input <file>`.
- **Milestone 3:** `lib/calc` — legacy postprocess (`postprocessLegacyDataset`), `computeAllStats` port, `analyzeBuild` with legacy-shaped stat groups and numeric summary (parity target: `ACStats.jsx` / `DataFuncs.js`).
- **Milestone 4+:** `lib/calc/accuracy` — FCS assist vs distance (legacy `RangePlot` breakpoints), recoil + tracking heuristics, `computeFullAccuracy`.

See `DEPLOYMENT.md` for hosting and database setup.

### Data merge

```bash
npm run data:merge
npm test
```

### Optional: apply CSV/JSON overrides

```bash
npm run data:merge:sheet -- --input data/source/overrides.example.csv
```

### Garage share links

`/garage?b=<12 hyphen-separated part IDs>` loads build A (11 assembly slots + expansion, in `REQUIRED_ASSEMBLY_SLOTS` order then expansion). `b2` enables compare mode for build B.
