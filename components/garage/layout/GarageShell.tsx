import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: ReactNode;
  actions?: ReactNode;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  oneColumn?: ReactNode;
  layout?: "three" | "one";
};

export function GarageShell({
  title,
  subtitle,
  actions,
  left,
  center,
  right,
  oneColumn,
  layout = "three",
}: Props) {
  return (
    <main
      id="garage-main"
      className="ac6-garage mx-auto max-w-[1500px] px-3 py-4 md:px-4 md:py-5"
      tabIndex={-1}
    >
      <div className="ac6-garage-header mb-2 border px-3 py-2">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
              MasterofArena // Garage
            </p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-[0.12em] text-cyan-100 md:text-2xl">
              {title}
            </h1>
            <p className="mt-1 max-w-3xl text-[11px] text-cyan-200/70">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
      </div>

      {layout === "one" ? (
        <section className="ac6-panel min-w-0 border p-2">{oneColumn}</section>
      ) : (
        <div className="grid gap-2 xl:grid-cols-[312px_minmax(0,1fr)_384px]">
          <section className="ac6-panel ac6-left-panel min-w-0 border p-2">{left}</section>
          <section className="ac6-panel ac6-center-panel min-w-0 border p-2">{center}</section>
          <section className="ac6-panel ac6-right-panel min-w-0 border p-2">{right}</section>
        </div>
      )}
    </main>
  );
}
