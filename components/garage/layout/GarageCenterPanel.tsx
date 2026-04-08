import type { ReactNode } from "react";

export function GarageCenterPanel({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="ac6-panel-title">Combat Preview</h2>
      {children}
    </div>
  );
}
