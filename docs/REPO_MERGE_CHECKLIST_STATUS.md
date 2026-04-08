# MasterofArena Repo Merge Checklist Status

Implemented from `MasterofArena_Repo_Merge_Checklist` with incremental, migration-safe changes.

## Phase 1 — Safe Architecture Cleanup

- [x] Created `src/` namespace scaffolding for calc/store/future systems.
- [x] Added calc bucket structure:
  - `src/lib/calc/core/*`
  - `src/lib/calc/advanced/*`
  - `src/lib/calc/legacy/*`
  - `src/lib/calc/models/*`
- [x] Kept behavior stable by using compatibility re-exports.
- [x] Added centralized garage state store scaffold (`src/lib/store/garage-store.ts`).
- [ ] Full garage UI split into shell + left/center/right panels (deferred; current UI remains stable).

## Phase 2 — Data + Validation Hardening

- [x] Kept existing import scripts.
- [x] Added required patch metadata support (`patchVersion`, `sourceVersion`, `spreadsheetVersion`, `overrideSources`).
- [x] Added generated import report output (`data/import-report.json` via `npm run data:merge`).
- [x] Added stronger data pipeline checks (row count + known parts + metadata assertions).
- [x] Added energy model generation stub script (`npm run data:generate:energy-models`).
- [x] Added merged-data validation script (`npm run data:validate`).

## Phase 3 — UI Fidelity Upgrade

- [x] Preserved existing plots and advanced stat views.
- [ ] AC6 layout fidelity pass (next work item).
- [ ] Hierarchical navigation flow.
- [ ] Hover-preview diff system upgrade.
- [ ] Sound hooks / scanline polish.

## Phase 4 — New Systems

- [x] Added architecture stubs:
  - `src/components/ac-viewer/*`
  - `src/lib/optimizer/*`
  - `src/lib/counters/*`
  - `src/lib/battle/*`
  - `src/lib/meta/*`
  - `src/lib/community/*`

## Phase 5 — Backend Expansion

- [x] Expanded Prisma schema with:
  - `User`
  - `Build`
  - `CommunityBuild`
  - `MetaRanking`
  - `BattleResult`
- [x] Added route handlers:
  - `app/api/builds/route.ts`
  - `app/api/community/builds/route.ts`
  - `app/api/meta/route.ts`
  - `app/api/battles/route.ts`
- [x] Added DTO + Zod validation modules under `lib/dto/*`.

## Notes

- Changes are scaffolding-first to preserve current app behavior and tests.
- Remaining checklist items are explicit follow-up implementation tasks, not blockers for current functionality.
