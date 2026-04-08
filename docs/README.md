# MasterofArena documentation

Implementation follows the milestone plan (foundation → data pipeline → calc engine → UI → …).

- **Milestone 1:** Next.js App Router, TypeScript, Tailwind, Prisma + PostgreSQL wiring, Vercel-ready.
- **Milestone 2:** Zod schemas (`lib/schema`), normalization (`lib/data`), `scripts/import-parts.ts` → `data/parts.merged.json`, Vitest coverage.
- **Milestone 3 (started):** `lib/calc/analyze-build.ts` — real `totalWeight` / `totalEnLoad`; other metrics stubbed for upcoming formulas.
- **Next:** Flesh out AP, defenses, boost, DPS, and weapon math to match AC6 builder behavior.

See `DEPLOYMENT.md` for hosting and database setup.

### Data merge

```bash
npm run data:merge
npm test
```
