import type { ReactNode } from "react";

export function GarageLeftPanel({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="ac6-panel-title">ASSEMBLY</h2>
      {children}
    </div>
  );
}
