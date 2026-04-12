import type { CSSProperties, ReactNode } from "react";

/**
 * Garage routes share one React shell (no classic iframe). Steel backdrop
 * uses the same tokens as the nav strip so theme YAML stays authoritative.
 */
export default function GarageLayout({ children }: { children: ReactNode }) {
  const shell: CSSProperties = {
    background: "linear-gradient(180deg, var(--ui-bg-top) 0%, var(--ui-bg-bottom) 100%)",
    color: "var(--ui-text)",
    minHeight: "calc(100dvh - 4.25rem)",
  };

  return (
    <div className="garage-route min-w-0" style={shell} data-garage-route="">
      {children}
    </div>
  );
}
