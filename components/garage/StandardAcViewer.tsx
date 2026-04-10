"use client";

import type { GarageBuildIds } from "@/lib/garage/default-assembly";
import type { CanonicalPart } from "@/lib/schema";

type Props = {
  build: GarageBuildIds;
  partsById: Map<number, CanonicalPart>;
};

type SlotView = {
  key: keyof GarageBuildIds;
  label: string;
  icon: string;
};

const SLOT_VIEWS: SlotView[] = [
  { key: "head", label: "HEAD", icon: "/assets/head-DNUrigrV.png" },
  { key: "core", label: "CORE", icon: "/assets/core-B8zPPW4_.png" },
  { key: "arms", label: "ARMS", icon: "/assets/arms-DqA1k8qI.png" },
  { key: "legs", label: "LEGS", icon: "/assets/legs-BJMIf3mC.png" },
  { key: "rightArm", label: "R-ARM", icon: "/assets/rightArm-DHkM81Mo.png" },
  { key: "leftArm", label: "L-ARM", icon: "/assets/leftArm-BzIzkCFS.png" },
  { key: "rightBack", label: "R-BACK", icon: "/assets/rightBack-C92IaCpT.png" },
  { key: "leftBack", label: "L-BACK", icon: "/assets/leftBack-DIMm5nm3.png" },
  { key: "booster", label: "BOOSTER", icon: "/assets/booster-yO0tdh-V.png" },
  { key: "fcs", label: "FCS", icon: "/assets/fcs-Dlc38BId.png" },
  { key: "generator", label: "GENERATOR", icon: "/assets/generator-gkpT6ntG.png" },
  { key: "expansionId", label: "EXPANSION", icon: "/assets/expansion-BuLbm5gH.png" },
];

export function StandardAcViewer({ build, partsById }: Props) {
  return (
    <div className="space-y-2 rounded border border-cyan-300/35 bg-cyan-950/20 p-3">
      <h3 className="text-sm font-semibold tracking-wide text-cyan-100">AC VIEWER · STANDARD</h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SLOT_VIEWS.map((slot) => {
          const id = Number(build[slot.key]);
          const partName = partsById.get(id)?.identity.name ?? "—";
          return (
            <div
              key={slot.key}
              className="flex items-center gap-2 rounded border border-cyan-300/25 bg-[#0f2233] px-2 py-1.5"
            >
              <img
                src={slot.icon}
                alt={slot.label}
                className="h-8 w-8 object-contain opacity-95"
              />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.15em] text-cyan-200/70">
                  {slot.label}
                </div>
                <div className="truncate text-xs font-medium text-cyan-50">{partName}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
