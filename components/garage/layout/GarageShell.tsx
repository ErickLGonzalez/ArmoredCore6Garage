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
      className="ac6-garage mx-auto max-w-[1600px] px-1.5 py-1.5 md:px-2 md:py-2"
      tabIndex={-1}
    >
      <div className="ac6-garage-header mb-1 px-1.5 py-1">
        <div className="flex flex-wrap items-end justify-between gap-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-cyan-300/80">
              MASTEROFARENA // GARAGE
            </p>
            <h1 className="mt-0.5 text-[20px] font-semibold tracking-[0.06em] text-cyan-100">
              {title}
            </h1>
            <p className="mt-0.5 max-w-3xl text-[10px] uppercase tracking-[0.04em] text-cyan-200/70">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-0.5 leading-none">{actions}</div>
        </div>
      </div>

      {layout === "one" ? (
        <section className="ac6-panel min-w-0 p-2">{oneColumn}</section>
      ) : (
        <div className="grid gap-1 xl:grid-cols-[288px_minmax(0,1fr)_336px]">
          <section className="ac6-panel ac6-left-panel min-w-0 p-2">{left}</section>
          <section className="ac6-panel ac6-center-panel min-w-0 p-2">{center}</section>
          <section className="ac6-panel ac6-right-panel min-w-0 p-2">{right}</section>
        </div>
      )}
    </main>
  );
}
