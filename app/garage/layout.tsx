import type { ReactNode } from "react";

/**
 * Garage routes share one React shell (no classic iframe). Full-bleed steel
 * backdrop under the site nav matches the shipped Vite bundle page chrome.
 */
export default function GarageLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="garage-route min-w-0 bg-[linear-gradient(180deg,#2f4052_0%,#1b2734_100%)] text-white"
      data-garage-route=""
    >
      {children}
    </div>
  );
}
