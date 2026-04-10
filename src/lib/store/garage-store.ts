import { create } from "zustand";
import type { SetStateAction } from "react";

import type { GarageBuildIds } from "@/lib/garage/default-assembly";

export type GarageTab = "build" | "parts" | "counters" | "viewer" | "systems";
export type CounterTab = "ricochet" | "ttk" | "stagger";
export type PartsSortState = { key: string; dir: "asc" | "desc" }[];

type GarageState = {
  buildA: GarageBuildIds | null;
  buildB: GarageBuildIds | null;
  compareOn: boolean;
  engagementM: number;
  selectedSlot: string | null;
  previewPartId: number | null;
  activeTab: GarageTab;
  counterTab: CounterTab;
  partsQuery: string;
  partsSorters: PartsSortState;
  partsColumnFilters: Record<string, string[]>;
  initialized: boolean;
  initialize: (buildA: GarageBuildIds, buildB: GarageBuildIds, compareOn: boolean) => void;
  setBuildA: (v: SetStateAction<GarageBuildIds>) => void;
  setBuildB: (v: SetStateAction<GarageBuildIds>) => void;
  setCompareOn: (v: SetStateAction<boolean>) => void;
  setEngagementM: (v: SetStateAction<number>) => void;
  setSelectedSlot: (v: SetStateAction<string | null>) => void;
  setPreviewPartId: (v: SetStateAction<number | null>) => void;
  setActiveTab: (v: SetStateAction<GarageTab>) => void;
  setCounterTab: (v: SetStateAction<CounterTab>) => void;
  setPartsQuery: (v: SetStateAction<string>) => void;
  setPartsSorters: (v: SetStateAction<PartsSortState>) => void;
  setPartsColumnFilters: (v: SetStateAction<Record<string, string[]>>) => void;
};

export const useGarageStore = create<GarageState>((set) => ({
  buildA: null,
  buildB: null,
  compareOn: false,
  engagementM: 180,
  selectedSlot: null,
  previewPartId: null,
  activeTab: "build",
  counterTab: "ricochet",
  partsQuery: "",
  partsSorters: [{ key: "Name", dir: "asc" }],
  partsColumnFilters: {},
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
  setSelectedSlot: (v) =>
    set((state) => ({
      selectedSlot: typeof v === "function" ? (v as (prev: string | null) => string | null)(state.selectedSlot) : v,
    })),
  setPreviewPartId: (v) =>
    set((state) => ({
      previewPartId: typeof v === "function" ? (v as (prev: number | null) => number | null)(state.previewPartId) : v,
    })),
  setActiveTab: (v) =>
    set((state) => ({
      activeTab: typeof v === "function" ? (v as (prev: GarageTab) => GarageTab)(state.activeTab) : v,
    })),
  setCounterTab: (v) =>
    set((state) => ({
      counterTab: typeof v === "function" ? (v as (prev: CounterTab) => CounterTab)(state.counterTab) : v,
    })),
  setPartsQuery: (v) =>
    set((state) => ({
      partsQuery: typeof v === "function" ? (v as (prev: string) => string)(state.partsQuery) : v,
    })),
  setPartsSorters: (v) =>
    set((state) => ({
      partsSorters: typeof v === "function" ? (v as (prev: PartsSortState) => PartsSortState)(state.partsSorters) : v,
    })),
  setPartsColumnFilters: (v) =>
    set((state) => ({
      partsColumnFilters:
        typeof v === "function"
          ? (v as (prev: Record<string, string[]>) => Record<string, string[]>)(state.partsColumnFilters)
          : v,
    })),
}));
