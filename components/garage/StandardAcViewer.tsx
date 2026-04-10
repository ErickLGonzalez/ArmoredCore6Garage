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

/** Matches `grid-template-areas` in `app/globals.css` (`.ac6-ac-composite`). */
const GRID_AREA_BY_SLOT: Record<keyof GarageBuildIds, string> = {
  rightBack: "rback",
  head: "head",
  leftBack: "lback",
  rightArm: "rarm",
  core: "core",
  leftArm: "larm",
  arms: "arms",
  legs: "legs",
  booster: "boost",
  fcs: "fcs",
  generator: "gen",
  expansionId: "exp",
};

function partNameFor(
  key: keyof GarageBuildIds,
  build: GarageBuildIds,
  partsById: Map<number, CanonicalPart>,
): string {
  const id = Number(build[key]);
  return partsById.get(id)?.identity.name ?? "—";
}

function CompositeSlot({
  slot,
  name,
}: {
  slot: SlotView;
  name: string;
}) {
  const area = GRID_AREA_BY_SLOT[slot.key];
  return (
    <div
      className="ac6-ac-slot-cell"
      style={{ gridArea: area }}
    >
      <img
        src={slot.icon}
        alt={slot.label}
        className="h-9 w-9 object-contain opacity-95 sm:h-10 sm:w-10"
      />
      <div className="w-full text-[8px] uppercase leading-none tracking-[0.06em] text-cyan-200/80">
        {slot.label}
      </div>
      <div
        className="line-clamp-2 w-full max-w-full break-words text-[9px] font-medium leading-tight text-cyan-50"
        title={name}
      >
        {name}
      </div>
    </div>
  );
}

export function StandardAcViewer({ build, partsById }: Props) {
  return (
    <div className="ac6-block space-y-2 p-2">
      <h3 className="ac6-block-title">AC VIEWER · STANDARD</h3>

      <p className="text-[10px] uppercase tracking-[0.06em] text-cyan-200/70 md:hidden">
        COMPOSITE LAYOUT ON WIDER VIEWPORTS.
      </p>

      <div className="ac6-ac-composite hidden md:grid" aria-label="AC composite silhouette">
        {SLOT_VIEWS.map((slot) => (
          <CompositeSlot
            key={slot.key}
            slot={slot}
            name={partNameFor(slot.key, build, partsById)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 md:hidden">
        {SLOT_VIEWS.map((slot) => {
          const name = partNameFor(slot.key, build, partsById);
          return (
            <div
              key={slot.key}
              className="ac6-slot-preview-row flex items-center gap-2 px-2 py-1"
            >
              <img
                src={slot.icon}
                alt={slot.label}
                className="h-10 w-10 shrink-0 object-contain opacity-95"
              />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.15em] text-cyan-200/70">
                  {slot.label}
                </div>
                <div className="truncate text-xs font-medium text-cyan-50">{name}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
