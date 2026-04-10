import type { ReactNode } from "react";

export function GarageRightPanel({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="ac6-panel-title">AC SPECS</h2>
      {children}
    </div>
  );
}
