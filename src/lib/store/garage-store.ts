import { create } from "zustand";

import type { GarageBuildIds } from "@/lib/garage/default-assembly";

type GarageState = {
  buildA: GarageBuildIds | null;
  buildB: GarageBuildIds | null;
  compareOn: boolean;
  engagementM: number;
  initialized: boolean;
  initialize: (buildA: GarageBuildIds, buildB: GarageBuildIds, compareOn: boolean) => void;
  setBuildA: (v: GarageBuildIds) => void;
  setBuildB: (v: GarageBuildIds) => void;
  setCompareOn: (v: boolean) => void;
  setEngagementM: (v: number) => void;
};

export const useGarageStore = create<GarageState>((set) => ({
  buildA: null,
  buildB: null,
  compareOn: false,
  engagementM: 180,
  initialized: false,
  initialize: (buildA, buildB, compareOn) =>
    set((prev) =>
      prev.initialized
        ? prev
        : { buildA, buildB, compareOn, initialized: true },
    ),
  setBuildA: (v) => set({ buildA: v }),
  setBuildB: (v) => set({ buildB: v }),
  setCompareOn: (v) => set({ compareOn: v }),
  setEngagementM: (v) => set({ engagementM: v }),
}));
