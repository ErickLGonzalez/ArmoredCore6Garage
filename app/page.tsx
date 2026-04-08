import Link from "next/link";

import { MasterofArenaMark } from "@/components/MasterofArenaMark";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
        Foundation
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-geist-sans)] text-4xl font-semibold tracking-tight sm:text-5xl">
        <MasterofArenaMark />
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
        Next.js, TypeScript, Tailwind, and Prisma are wired for PostgreSQL. The AC6
        parts pipeline and calc engine are in place; open the garage for a first
        interactive preview of <code className="rounded bg-zinc-200/80 px-1 dark:bg-zinc-800">analyzeBuild</code>{" "}
        output.
      </p>
      <p className="mt-6">
        <Link
          href="/garage"
          className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Open garage
        </Link>
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
            npm run data:merge
          </code>{" "}
          — build <code className="rounded bg-zinc-200/80 px-1 dark:bg-zinc-800">parts.merged.json</code> before the garage
        </li>
        <li>
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 dark:bg-zinc-800">
            cp .env.example .env
          </code>{" "}
          — then set{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 dark:bg-zinc-800">
            DATABASE_URL
          </code>{" "}
          for Prisma
        </li>
      </ul>
    </div>
  );
}
