import { create } from "zustand";
import type { SetStateAction } from "react";

import type { GarageBuildIds } from "@/lib/garage/default-assembly";

type GarageState = {
  buildA: GarageBuildIds | null;
  buildB: GarageBuildIds | null;
  compareOn: boolean;
  engagementM: number;
  initialized: boolean;
  initialize: (buildA: GarageBuildIds, buildB: GarageBuildIds, compareOn: boolean) => void;
  setBuildA: (v: SetStateAction<GarageBuildIds>) => void;
  setBuildB: (v: SetStateAction<GarageBuildIds>) => void;
  setCompareOn: (v: SetStateAction<boolean>) => void;
  setEngagementM: (v: SetStateAction<number>) => void;
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
  setBuildA: (v) =>
    set((state) => ({
      buildA:
        typeof v === "function"
          ? state.buildA
            ? (v as (prev: GarageBuildIds) => GarageBuildIds)(state.buildA)
            : state.buildA
          : v,
    })),
  setBuildB: (v) =>
    set((state) => ({
      buildB:
        typeof v === "function"
          ? state.buildB
            ? (v as (prev: GarageBuildIds) => GarageBuildIds)(state.buildB)
            : state.buildB
          : v,
    })),
  setCompareOn: (v) =>
    set((state) => ({
      compareOn: typeof v === "function" ? (v as (prev: boolean) => boolean)(state.compareOn) : v,
    })),
  setEngagementM: (v) =>
    set((state) => ({
      engagementM: typeof v === "function" ? (v as (prev: number) => number)(state.engagementM) : v,
    })),
}));
