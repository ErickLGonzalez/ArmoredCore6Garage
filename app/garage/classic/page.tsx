import Link from "next/link";

export const metadata = {
  title: "Garage Classic",
};

export default function GarageClassicPage() {
  return (
    <main className="ac6-garage mx-auto max-w-[1600px] px-1.5 py-2 md:px-2 md:py-2">
      <div className="ac6-garage-header mb-1 px-1.5 py-1">
        <div className="flex flex-wrap items-end justify-between gap-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-cyan-300/80">
              MASTEROFARENA // GARAGE
            </p>
            <h1 className="font-moa-brand mt-0.5 text-[20px] font-semibold tracking-[0.06em] text-cyan-100">
              LEGACY MODE
            </h1>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.04em] text-cyan-200/70">
              EMBEDDED CLASSIC BUILD TOOL (STATIC BUNDLE)
            </p>
          </div>
          <Link
            href="/garage"
            className="classic-tab"
          >
            MODERN GARAGE
          </Link>
        </div>
      </div>

      <iframe
        title="MasterofArena classic garage"
        src="/masterofarena-classic.html"
        className="w-full border-2 bg-black"
        style={{
          borderColor: "var(--ui-border)",
          height: "min(92vh, 900px)",
        }}
      />
    </main>
  );
}
