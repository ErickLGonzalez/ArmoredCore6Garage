import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: ReactNode;
  actions?: ReactNode;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
};

export function GarageShell({ title, subtitle, actions, left, center, right }: Props) {
  return (
    <main
      id="garage-main"
      className="ac6-garage mx-auto max-w-[1500px] px-4 py-6 md:px-6"
      tabIndex={-1}
    >
      <div className="ac6-garage-header mb-4 rounded-md border px-4 py-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
              MasterofArena // Garage
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-wide text-cyan-100 md:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-xs text-cyan-200/70">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[312px_minmax(0,1fr)_384px]">
        <section className="ac6-panel ac6-left-panel min-w-0 rounded-md border p-3">{left}</section>
        <section className="ac6-panel ac6-center-panel min-w-0 rounded-md border p-3">{center}</section>
        <section className="ac6-panel ac6-right-panel min-w-0 rounded-md border p-3">{right}</section>
      </div>
    </main>
  );
}
