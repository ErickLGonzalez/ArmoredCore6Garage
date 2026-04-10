import type { ReactNode } from "react";

export function GarageCenterPanel({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="ac6-panel-title">COMBAT PREVIEW</h2>
      {children}
    </div>
  );
}
