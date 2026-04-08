import type { ReactNode } from "react";

export function GarageRightPanel({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="ac6-panel-title">Detailed Stats</h2>
      {children}
    </div>
  );
}
