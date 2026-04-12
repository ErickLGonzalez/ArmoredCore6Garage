"use client";

import { garageUiAsset } from "@/lib/garage/garage-ui-assets";
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
  { key: "head", label: "HEAD", icon: garageUiAsset("head-DNUrigrV.png") },
  { key: "core", label: "CORE", icon: garageUiAsset("core-B8zPPW4_.png") },
  { key: "arms", label: "ARMS", icon: garageUiAsset("arms-DqA1k8qI.png") },
  { key: "legs", label: "LEGS", icon: garageUiAsset("legs-BJMIf3mC.png") },
  { key: "rightArm", label: "R-ARM", icon: garageUiAsset("rightArm-DHkM81Mo.png") },
  { key: "leftArm", label: "L-ARM", icon: garageUiAsset("leftArm-BzIzkCFS.png") },
  { key: "rightBack", label: "R-BACK", icon: garageUiAsset("rightBack-C92IaCpT.png") },
  { key: "leftBack", label: "L-BACK", icon: garageUiAsset("leftBack-DIMm5nm3.png") },
  { key: "booster", label: "BOOSTER", icon: garageUiAsset("booster-yO0tdh-V.png") },
  { key: "fcs", label: "FCS", icon: garageUiAsset("fcs-Dlc38BId.png") },
  { key: "generator", label: "GENERATOR", icon: garageUiAsset("generator-gkpT6ntG.png") },
  { key: "expansionId", label: "EXPANSION", icon: garageUiAsset("expansion-BuLbm5gH.png") },
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
        className="ac6-ac-slot-icon"
      />
      <div className="ac6-ac-slot-type-label">
        {slot.label}
      </div>
      <div
        className="ac6-ac-slot-part-name"
        title={name}
      >
        {name}
      </div>
    </div>
  );
}

export function StandardAcViewer({ build, partsById }: Props) {
  return (
    <div className="ac6-ac-viewer">
      <div className="ac6-ac-composite-scroll">
        <div
          className="ac6-ac-composite"
          aria-label="AC composite silhouette"
        >
          {SLOT_VIEWS.map((slot) => (
            <CompositeSlot
              key={slot.key}
              slot={slot}
              name={partNameFor(slot.key, build, partsById)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
