# Deploying MasterofArena

## Vercel

1. Create a project and import this repository.
2. Set **Environment variables** in the Vercel dashboard:
   - `DATABASE_URL` — connection string from Supabase, Neon, or Vercel Postgres.
3. **Build command:** `npm run build` (default).
4. After the first deploy, run migrations against production (from CI or locally with production `DATABASE_URL`):
   - `npx prisma migrate deploy`

## Database

- Provision **PostgreSQL** (Supabase, Neon, Railway, local Docker, etc.).
- Copy `.env.example` to `.env` and set `DATABASE_URL`.
- Create / update schema:
  - `npx prisma migrate dev --name init` (development)
  - `npx prisma db push` (prototyping without migration files)

## Local development

```bash
npm install
cp .env.example .env
# edit .env with a real DATABASE_URL
npx prisma generate
npm run dev
```
