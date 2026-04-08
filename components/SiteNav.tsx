import Link from "next/link";

import { MasterofArenaMark } from "@/components/MasterofArenaMark";

export function SiteNav() {
  return (
    <header className="border-b border-cyan-300/30 bg-[#071420]/85 backdrop-blur">
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
            className="uppercase tracking-wide text-cyan-200/75 transition-colors hover:text-cyan-100"
          >
            Home
          </Link>
          <Link
            href="/garage"
            className="uppercase tracking-wide text-cyan-200/75 transition-colors hover:text-cyan-100"
          >
            Garage
          </Link>
        </div>
      </nav>
    </header>
  );
}
