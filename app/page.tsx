import { MasterofArenaMark } from "@/components/MasterofArenaMark";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
        Foundation
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-geist-sans)] text-4xl font-semibold tracking-tight sm:text-5xl">
        <MasterofArenaMark />
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
        Next.js, TypeScript, Tailwind, and Prisma are wired for PostgreSQL.
        Upcoming milestones add the AC6 data pipeline, calc engine, and garage
        UI.
      </p>
      <ul className="mt-10 space-y-2 font-[family-name:var(--font-geist-mono)] text-sm text-zinc-500 dark:text-zinc-400">
        <li>
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 dark:bg-zinc-800">
            npm run dev
          </code>{" "}
          — local App Router
        </li>
        <li>
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 dark:bg-zinc-800">
            npx prisma generate
          </code>{" "}
          — Prisma Client
        </li>
        <li>
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 dark:bg-zinc-800">
            cp .env.example .env
          </code>{" "}
          — then set{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 dark:bg-zinc-800">
            DATABASE_URL
          </code>
        </li>
      </ul>
    </div>
  );
}
