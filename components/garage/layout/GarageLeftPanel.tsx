import type { ReactNode } from "react";

export function GarageLeftPanel({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="ac6-panel-title">Assembly</h2>
      {children}
    </div>
  );
}
