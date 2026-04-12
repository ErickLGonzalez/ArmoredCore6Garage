import Link from "next/link";

export const metadata = {
  title: "Garage Classic",
};

export default function GarageClassicPage() {
  return (
    <main
      id="garage-main"
      className="ac6-garage mx-auto max-w-[1600px] px-1.5 py-1.5 md:px-2 md:py-2"
      tabIndex={-1}
    >
      <div className="ac6-garage-header mb-1">
        <div className="px-1.5 py-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-cyan-300/80">
            MASTEROFARENA // GARAGE
          </p>
          <h1 className="font-moa-brand mt-0.5 text-[20px] font-semibold tracking-[0.06em] text-cyan-100">
            LEGACY MODE
          </h1>
          <p className="mt-0.5 max-w-3xl text-[10px] uppercase tracking-[0.04em] text-cyan-200/70">
            STATIC VITE BUNDLE IN IFRAME — USES /assets/* (MIRRORED FROM GARAGE-UI-ASSETS ON
            INSTALL)
          </p>
        </div>
        <div className="ac6-garage-header-tabdeck px-1.5 py-1">
          <div className="flex flex-wrap items-center gap-0.5">
            <div className="ac6-header-tab-row">
              <span className="classic-tab classic-tab-active pointer-events-none select-none">
                LEGACY MODE
              </span>
            </div>
            <div className="ac6-header-util-row">
              <Link
                href="/garage"
                className="classic-tab text-[10px] focus-visible:outline-none"
              >
                MODERN GARAGE
              </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="ac6-panel min-w-0 overflow-hidden p-0">
        <div className="ac6-strip px-2 py-[3px]">
          <p className="ac6-chart-section-title m-0">CLASSIC UI (EMBEDDED)</p>
        </div>
        <iframe
          title="MasterofArena classic garage"
          src="/masterofarena-classic.html"
          className="ac6-classic-iframe w-full border-0 bg-black"
          style={{ height: "min(88vh, 860px)" }}
        />
      </section>
    </main>
  );
}
