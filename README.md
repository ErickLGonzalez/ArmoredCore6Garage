# MasterofArena

Web application for **Armored Core VI** build analysis, garage tooling, and related systems. This repo is the **Next.js** foundation (App Router, TypeScript, Tailwind, Prisma + PostgreSQL), aligned with the MasterofArena milestone plan.

The legacy **Vite** reference app lives in a separate repository and is unchanged.

## Stack

- **Next.js** (App Router) · **TypeScript** · **Tailwind CSS**
- **Prisma** · **PostgreSQL** (Supabase, Neon, Vercel Postgres, Docker, etc.)
- **Zod** (validated part data) · **Vitest**
- **ESLint** · **Prettier**

## Prerequisites

- Node.js 20+
- A PostgreSQL database and `DATABASE_URL` (see `.env.example`)

## Setup

```bash
npm install
cp .env.example .env
# Set DATABASE_URL in .env, then:
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script               | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | App Router dev (Turbopack)               |
| `npm run build`      | Production build                         |
| `npm run start`      | Run production server                    |
| `npm run lint`       | ESLint                                   |
| `npm run format`     | Prettier write                           |
| `npm run db:*`       | Prisma CLI shortcuts                     |
| `npm run data:merge` | Build `data/parts.merged.json` from JSON |
| `npm test`           | Vitest (schema, pipeline, calc)          |

`postinstall` runs `prisma generate` (needed for Vercel and fresh clones).

## Layout

| Path          | Purpose                                      |
| ------------- | -------------------------------------------- |
| `app/`        | Routes, layouts, global styles               |
| `components/` | UI components                                |
| `lib/`        | Prisma, Zod schemas, data merge, calc engine |
| `data/`       | Source JSON + generated `parts.merged.json`  |
| `scripts/`    | CLI (import / merge)                         |
| `tests/`      | Vitest                                       |
| `prisma/`     | Schema and migrations                        |
| `docs/`       | Internal docs and deployment                 |

**Milestones:** (1) Foundation · (2) Data pipeline + merge · (3) Calc engine started (`analyzeBuild` weight/EN).

## Deploy

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Vercel and database notes.

## License

Private / TBD — match your upstream data and asset licenses when publishing.
