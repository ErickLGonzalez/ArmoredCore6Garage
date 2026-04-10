import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { Suspense } from "react";

import { defaultGarageSelection } from "@/lib/garage/default-assembly";
import { MergedDatasetSchema } from "@/lib/schema";

import { GarageClient } from "./garage-client";

/** Always read latest `parts.merged.json` from disk (no stale static snapshot after `data:merge`). */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "GARAGE",
};

type GaragePageProps = {
  searchParams: Promise<{ b?: string; b2?: string }>;
};

export default async function GaragePage({ searchParams }: GaragePageProps) {
  const q = await searchParams;
  const mergedPath = path.join(process.cwd(), "data", "parts.merged.json");

  if (!existsSync(mergedPath)) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold uppercase tracking-[0.16em]">GARAGE</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          NO MERGED PARTS FILE FOUND. GENERATE IT FROM THE REPO ROOT:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-900">
          npm run data:merge
        </pre>
      </div>
    );
  }

  const raw = readFileSync(mergedPath, "utf-8");
  const parsed = MergedDatasetSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold uppercase tracking-[0.16em]">GARAGE</h1>
        <p className="mt-4 text-red-600 dark:text-red-400">
          INVALID{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">parts.merged.json</code>
          . RE-RUN{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">npm run data:merge</code>.
        </p>
      </div>
    );
  }

  const defaults = defaultGarageSelection(parsed.data.parts);
  if (!defaults) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold uppercase tracking-[0.16em]">GARAGE</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          THE DEFAULT STARTER BUILD COULD NOT BE RESOLVED FROM THIS DATASET (MISSING
          EXPECTED PART NAMES). CHECK{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">data:merge</code> output.
        </p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-6 py-16 text-center text-zinc-500">
          LOADING GARAGE...
        </div>
      }
    >
      <GarageClient
        parts={parsed.data.parts}
        defaultBuild={defaults}
        initialQueryB={q.b ?? null}
        initialQueryB2={q.b2 ?? null}
      />
    </Suspense>
  );
}
