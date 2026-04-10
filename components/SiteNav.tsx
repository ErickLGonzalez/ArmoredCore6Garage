import Link from "next/link";

import { MasterofArenaMark } from "@/components/MasterofArenaMark";
import { UserThemeControls } from "@/components/UserThemeControls";

export function SiteNav() {
  return (
    <header
      className="border-b-2"
      style={{
        borderColor: "var(--ui-border)",
        background: "linear-gradient(180deg, var(--ui-panel-top), var(--ui-panel-bottom))",
      }}
    >
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-3 py-2">
        <Link
          href="/"
          className="text-lg transition-opacity hover:opacity-80"
        >
          <MasterofArenaMark />
        </Link>
        <div className="flex gap-4 text-[12px] font-medium" style={{ color: "var(--ui-text-dim)" }}>
          <Link
            href="/"
            className="uppercase tracking-[0.04em] transition-opacity hover:opacity-90"
          >
            HOME
          </Link>
          <Link
            href="/garage"
            className="uppercase tracking-[0.04em] transition-opacity hover:opacity-90"
          >
            GARAGE
          </Link>
        </div>
        <UserThemeControls />
      </nav>
    </header>
  );
}
