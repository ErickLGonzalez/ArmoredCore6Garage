import Link from "next/link";
 
export const metadata = {
  title: "Garage Classic",
};

export default function GarageClassicPage() {
  return (
    <main className="mx-auto max-w-[1700px] px-4 py-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded border border-cyan-300/40 bg-cyan-950/25 px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/80">
            MasterofArena // Legacy UI Mode
          </p>
          <h1 className="mt-1 text-lg font-semibold text-cyan-100">
            AC6 Advanced Garage (Classic Replica)
          </h1>
        </div>
        <Link
          href="/garage"
          className="rounded border border-cyan-300/45 bg-cyan-900/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-100 transition-colors hover:bg-cyan-800/35"
        >
          Back to Modern Garage
        </Link>
      </div>

      <iframe
        title="MasterofArena classic garage"
        src="/masterofarena-classic.html"
        className="h-[900px] w-full rounded border border-cyan-300/30 bg-black"
      />
    </main>
  );
}
