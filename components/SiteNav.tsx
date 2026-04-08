import Link from "next/link";

import { MasterofArenaMark } from "@/components/MasterofArenaMark";

export function SiteNav() {
  return (
    <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          className="text-lg transition-opacity hover:opacity-80"
        >
          <MasterofArenaMark />
        </Link>
        <div className="flex gap-6 text-sm font-medium">
          <Link
            href="/"
            className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Home
          </Link>
          <Link
            href="/garage"
            className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Garage
          </Link>
        </div>
      </nav>
    </header>
  );
}
