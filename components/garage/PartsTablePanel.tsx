"use client";

import { useEffect, useMemo, useState } from "react";

import { ManufacturerThumbnail, PartThumbnail } from "@/components/garage/PartThumbnail";
import { garageUiAsset } from "@/lib/garage/garage-ui-assets";
import type { CanonicalPart } from "@/lib/schema";
import { useGarageStore } from "@/src/lib/store/garage-store";

type Props = {
  parts: CanonicalPart[];
};

type SlotKey =
  | "all"
  | "rightArm"
  | "leftArm"
  | "rightBack"
  | "leftBack"
  | "head"
  | "core"
  | "arms"
  | "legs"
  | "booster"
  | "fcs"
  | "generator"
  | "expansion";

type ColKey = string;
type SortDir = "asc" | "desc";
type Sorter = { key: ColKey; dir: SortDir };
type Preset = {
  name: string;
  query: string;
  slot: SlotKey;
  visibleCols: ColKey[];
  colOrder: ColKey[];
  sorters: Sorter[];
  columnFilters: Record<string, string[]>;
};

const PRESET_KEY = "masterofarena.parts.presets.v1";
const MUL_CHAR = "\u00d7";

const SORT_ASC_ICON = garageUiAsset("sort_ascending-CKKvPke2.png");
const SORT_DESC_ICON = garageUiAsset("sort_descending-R6blHvQV.png");

const SLOT_OPTIONS: { key: SlotKey; label: string; icon?: string }[] = [
  { key: "all", label: "ALL" },
  { key: "rightArm", label: "R-ARM", icon: garageUiAsset("rightArm-DHkM81Mo.png") },
  { key: "leftArm", label: "L-ARM", icon: garageUiAsset("leftArm-BzIzkCFS.png") },
  { key: "rightBack", label: "R-BACK", icon: garageUiAsset("rightBack-C92IaCpT.png") },
  { key: "leftBack", label: "L-BACK", icon: garageUiAsset("leftBack-DIMm5nm3.png") },
  { key: "head", label: "HEAD", icon: garageUiAsset("head-DNUrigrV.png") },
  { key: "core", label: "CORE", icon: garageUiAsset("core-B8zPPW4_.png") },
  { key: "arms", label: "ARMS", icon: garageUiAsset("arms-DqA1k8qI.png") },
  { key: "legs", label: "LEGS", icon: garageUiAsset("legs-BJMIf3mC.png") },
  { key: "booster", label: "BOOST", icon: garageUiAsset("booster-yO0tdh-V.png") },
  { key: "fcs", label: "FCS", icon: garageUiAsset("fcs-Dlc38BId.png") },
  { key: "generator", label: "GEN", icon: garageUiAsset("generator-gkpT6ntG.png") },
  { key: "expansion", label: "EXP", icon: garageUiAsset("expansion-BuLbm5gH.png") },
];

const DISPLAY_STRING_TABLE: Record<string, string> = {
  rightArm: "R-ARM UNIT",
  leftArm: "L-ARM UNIT",
  rightBack: "R-BACK UNIT",
  leftBack: "L-BACK UNIT",
  fcs: "FCS",
  QBENConsumption: "QB EN Consumption",
  ABENConsumption: "AB EN Consumption",
  EffectiveAPKinetic: "Effective AP (Kinetic)",
  EffectiveAPEnergy: "Effective AP (Energy)",
  EffectiveAPExplosive: "Effective AP (Explosive)",
  EffectiveAPAvg: "Effective AP (Avg.)",
  QBENRechargeTime: "QB EN Recharge Time",
  ENRechargeDelayRedline: "EN Rech. Delay (Redline)",
  FullRechargeTimeRedline: "Full Rech. Time (Redline)",
  RightBackMissileLockTime: "R-Back Missile Lock Time",
  LeftBackMissileLockTime: "L-Back Missile Lock Time",
  "ACS Failure": "ACS Failure",
  "Semi-Auto": "Semi-Auto",
  "Full-Auto": "Full-Auto",
  ReloadTimeOverheat: "Reload Time (Overheat)",
  GroundedBoostSpeed: "Boost Speed (Grounded)",
  AerialBoostSpeed: "Boost Speed (Aerial)",
  DefaultOrdering: "Default",
  ChgDirectHitAdjustment: "Chg Direct Hit Adj.",
  FullChgDirectHitAdjustment: "Full Chg Direct Hit Adj.",
};

const CLASSIC_PART_STAT_GROUPS: Record<string, string[][]> = {
  Unit: [
    [
      "AttackPower",
      "Impact",
      "AccumulativeImpact",
      "Damage/s",
      "Impact/s",
      "AccumulativeImpact/s",
      "Damage/sInclReload",
      "Impact/sInclReload",
      "AccImpact/sInclReload",
      "ComboDamage",
      "ComboImpact",
      "ComboAccumulativeImpact",
      "DirectAttackPower",
      "DirectDamage/s",
      "ComboDirectDamage",
      "BlastRadius",
      "ATKHeatBuildup",
      "ConsecutiveHits",
      "DamageMitigation",
      "ImpactDampening",
      "BulletSpeed",
    ],
    [
      "ChgAttackPower",
      "ChgImpact",
      "ChgAccumImpact",
      "ChgDirectAttackPower",
      "ChgBlastRadius",
      "ChgHeatBuildup",
      "ChgBulletSpeed",
      "FullChgAttackPower",
      "FullChgImpact",
      "FullChgAccumImpact",
      "FullChgDirectAttackPower",
      "FullChgBlastRadius",
      "FullChgHeatBuildup",
      "IGDamageMitigation",
      "IGImpactDampening",
      "IGDuration",
      "DplyHeatBuildup",
      "FullChgBulletSpeed",
    ],
    [
      "DirectHitAdjustment",
      "ChgDirectHitAdjustment",
      "FullChgDirectHitAdjustment",
      "PAInterference",
      "Recoil",
      "MaxRecoilAngle",
      "Guidance",
      "IdealRange",
      "EffectiveRange",
      "ChgIdealRange",
      "ChgEffectiveRange",
      "HomingLockTime",
      "MaxLockCount",
      "RapidFire",
      "BurstFireInterval",
      "ChgENLoad",
      "ChargeTime",
      "FullChgTime",
      "ChgAmmoConsumption",
      "FullChgAmmoConsump",
      "MagazineRounds",
      "MagDumpTime",
      "TotalRounds",
      "ReloadTime",
      "ReloadTimeOverheat",
      "DeploymentRange",
      "Cooling",
      "CoolingDelay",
      "AmmunitionCost",
    ],
    ["Weight", "ENLoad"],
  ],
  Head: [
    ["AP", "AntiKineticDefense", "AntiEnergyDefense", "AntiExplosiveDefense"],
    ["AttitudeStability", "SystemRecovery", "ScanDistance", "ScanEffectDuration", "ScanStandbyTime"],
    ["Weight", "ENLoad"],
  ],
  Core: [
    ["AP", "AntiKineticDefense", "AntiEnergyDefense", "AntiExplosiveDefense"],
    ["AttitudeStability", "BoosterEfficiencyAdj", "GeneratorOutputAdj", "GeneratorSupplyAdj"],
    ["Weight", "ENLoad"],
  ],
  Arms: [
    ["AP", "AntiKineticDefense", "AntiEnergyDefense", "AntiExplosiveDefense"],
    ["ArmsLoadLimit", "RecoilControl", "FirearmSpecialization", "MeleeSpecialization"],
    ["Weight", "ENLoad"],
  ],
  Legs: [
    ["AP", "AntiKineticDefense", "AntiEnergyDefense", "AntiExplosiveDefense"],
    ["AttitudeStability", "LoadLimit", "JumpDistance", "JumpHeight", "TravelSpeed", "HighSpeedPerf"],
    [
      "Thrust",
      "UpwardThrust",
      "UpwardENConsumption",
      "QBThrust",
      "QBJetDuration",
      "QBENConsumption",
      "QBReloadTime",
      "QBReloadIdealWeight",
      "ABThrust",
      "ABENConsumption",
      "MeleeAttackThrust",
    ],
    ["Weight", "ENLoad"],
  ],
  Booster: [
    ["Thrust", "UpwardThrust", "UpwardENConsumption"],
    ["QBThrust", "QBJetDuration", "QBENConsumption", "QBReloadTime", "QBReloadIdealWeight"],
    ["ABThrust", "ABENConsumption"],
    ["MeleeAttackThrust", "MeleeAtkENConsump"],
    ["Weight", "ENLoad"],
  ],
  FCS: [
    ["CloseRangeAssist", "MediumRangeAssist", "LongRangeAssist"],
    ["MissileLockCorrection", "MultiLockCorrection"],
    ["Weight", "ENLoad"],
  ],
  Generator: [
    ["ENCapacity", "ENRecharge", "SupplyRecovery", "PostRecoveryENSupply", "EnergyFirearmSpec"],
    ["Weight", "ENOutput"],
  ],
  Expansion: [
    ["AttackPower", "Impact", "AccumulativeImpact", "BlastRadius", "EffectRange", "Resilience", "Duration"],
    ["DirectHitAdjustment"],
  ],
};

const GROUP_LABELS: Record<string, string[]> = {
  Unit: ["Offense", "Charge/Alt", "Handling/Ammo", "Load"],
  Head: ["Defense", "Systems", "Load"],
  Core: ["Defense", "Output Adj.", "Load"],
  Arms: ["Defense", "Arm Specs", "Load"],
  Legs: ["Defense", "Mobility", "Booster", "Load"],
  Booster: ["Thrust", "QB", "AB", "Melee", "Load"],
  FCS: ["Range Assist", "Missile Lock", "Load"],
  Generator: ["EN", "Load/Output"],
  Expansion: ["Main", "Direct Hit"],
};

const DEFAULT_SORT_BY_KIND: Record<string, Sorter[]> = {
  Unit: [{ key: "DefaultOrdering", dir: "asc" }, { key: "Name", dir: "asc" }],
  Head: [{ key: "AP", dir: "desc" }, { key: "Name", dir: "asc" }],
  Core: [{ key: "AP", dir: "desc" }, { key: "Name", dir: "asc" }],
  Arms: [{ key: "ArmsLoadLimit", dir: "desc" }, { key: "Name", dir: "asc" }],
  Legs: [{ key: "LoadLimit", dir: "desc" }, { key: "Name", dir: "asc" }],
  Booster: [{ key: "Thrust", dir: "desc" }, { key: "Name", dir: "asc" }],
  FCS: [{ key: "CloseRangeAssist", dir: "desc" }, { key: "Name", dir: "asc" }],
  Generator: [{ key: "ENOutput", dir: "desc" }, { key: "Name", dir: "asc" }],
  Expansion: [{ key: "Name", dir: "asc" }],
};

const DEFAULT_VISIBLE_BY_KIND: Record<string, string[]> = {
  Unit: [
    "Name",
    "AttackPower",
    "Impact",
    "AccumulativeImpact",
    "Damage/sInclReload",
    "Impact/sInclReload",
    "AccImpact/sInclReload",
    "IdealRange",
    "EffectiveRange",
    "RapidFire",
    "ReloadTime",
    "Weight",
    "ENLoad",
  ],
  Head: [
    "Name",
    "AP",
    "AntiKineticDefense",
    "AntiEnergyDefense",
    "AntiExplosiveDefense",
    "AttitudeStability",
    "SystemRecovery",
    "Weight",
    "ENLoad",
  ],
  Core: [
    "Name",
    "AP",
    "AntiKineticDefense",
    "AntiEnergyDefense",
    "AntiExplosiveDefense",
    "AttitudeStability",
    "BoosterEfficiencyAdj",
    "GeneratorOutputAdj",
    "GeneratorSupplyAdj",
    "Weight",
    "ENLoad",
  ],
  Arms: [
    "Name",
    "AP",
    "ArmsLoadLimit",
    "RecoilControl",
    "FirearmSpecialization",
    "MeleeSpecialization",
    "Weight",
    "ENLoad",
  ],
  Legs: [
    "Name",
    "AP",
    "LoadLimit",
    "AttitudeStability",
    "JumpDistance",
    "TravelSpeed",
    "Thrust",
    "QBThrust",
    "Weight",
    "ENLoad",
  ],
  Booster: [
    "Name",
    "Thrust",
    "UpwardThrust",
    "QBThrust",
    "QBENConsumption",
    "QBReloadTime",
    "ABThrust",
    "ABENConsumption",
    "Weight",
    "ENLoad",
  ],
  FCS: [
    "Name",
    "CloseRangeAssist",
    "MediumRangeAssist",
    "LongRangeAssist",
    "MissileLockCorrection",
    "MultiLockCorrection",
    "Weight",
    "ENLoad",
  ],
  Generator: [
    "Name",
    "ENCapacity",
    "ENOutput",
    "ENRecharge",
    "SupplyRecovery",
    "PostRecoveryENSupply",
    "EnergyFirearmSpec",
    "Weight",
  ],
  Expansion: [
    "Name",
    "AttackPower",
    "Impact",
    "AccumulativeImpact",
    "BlastRadius",
    "EffectRange",
    "Duration",
    "DirectHitAdjustment",
  ],
};

function splitCamelCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function toDisplayString(key: string): string {
  return DISPLAY_STRING_TABLE[key] ?? splitCamelCase(key);
}

function resolveListValue(raw: unknown): number {
  if (Array.isArray(raw) && raw.length >= 2) {
    const a = Number(raw[0]);
    const b = Number(raw[1]);
    if (Number.isFinite(a) && Number.isFinite(b)) return a * b;
  }
  return Number(raw);
}

function getPartClass(slot: SlotKey): "armUnit" | "backUnit" | "head" | "core" | "arms" | "legs" | "booster" | "fcs" | "generator" | "expansion" | "all" {
  if (slot === "all") return "all";
  if (slot === "rightArm" || slot === "leftArm") return "armUnit";
  if (slot === "rightBack" || slot === "leftBack") return "backUnit";
  return slot;
}

function partClassToKind(partClass: ReturnType<typeof getPartClass>): string {
  if (partClass === "armUnit" || partClass === "backUnit") return "Unit";
  if (partClass === "fcs") return "FCS";
  if (partClass === "all") return "Unit";
  return partClass[0]!.toUpperCase() + partClass.slice(1);
}

function getColValue(p: CanonicalPart, key: string): unknown {
  if (key === "Name") return p.identity.name;
  if (key === "Kind") return p.identity.kind;
  if (key === "Manufacturer") return p.identity.manufacturer ?? "-";
  return p.baseStats[key];
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "-";
  if (Array.isArray(v) && v.length >= 2) {
    return `${fmt(v[0])}${MUL_CHAR}${fmt(v[1])}`;
  }
  if (typeof v === "number" && Number.isFinite(v)) return v.toLocaleString();
  return String(v);
}

function colWidth(key: string): number {
  if (key === "Name") return 300;
  if (["WeaponType", "AttackType", "ReloadType", "LegType"].includes(key)) return 170;
  if (key === "Manufacturer") return 200;
  if (["Description"].includes(key)) return 320;
  return 150;
}

export function PartsTablePanel({ parts }: Props) {
  const {
    selectedSlot,
    partsQuery,
    partsSorters,
    partsColumnFilters,
    setSelectedSlot,
    setPreviewPartId,
    setPartsQuery,
    setPartsSorters,
    setPartsColumnFilters,
  } = useGarageStore();
  const initialSlot = (selectedSlot && SLOT_OPTIONS.some((s) => s.key === selectedSlot)
    ? selectedSlot
    : "all") as SlotKey;
  const [query, setQuery] = useState(partsQuery);
  const [slot, setSlot] = useState<SlotKey>(initialSlot);
  const [sorters, setSorters] = useState<Sorter[]>(
    partsSorters.length > 0 ? partsSorters : [{ key: "Name", dir: "asc" }],
  );
  const [visibleCols, setVisibleCols] = useState<ColKey[]>(["Name"]);
  const [colOrder, setColOrder] = useState<ColKey[]>(["Name"]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [dragCol, setDragCol] = useState<ColKey | null>(null);
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>(
    partsColumnFilters,
  );
  const [filterSearch, setFilterSearch] = useState("");
  const partClass = getPartClass(slot);

  useEffect(() => {
    setPartsQuery(query);
  }, [query, setPartsQuery]);

  useEffect(() => {
    setSelectedSlot(slot);
  }, [slot, setSelectedSlot]);

  useEffect(() => {
    setPartsSorters(sorters);
  }, [sorters, setPartsSorters]);

  useEffect(() => {
    setPartsColumnFilters(columnFilters);
  }, [columnFilters, setPartsColumnFilters]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRESET_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Preset[];
      if (Array.isArray(parsed)) setPresets(parsed);
    } catch {
      // ignore bad localStorage payloads
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
  }, [presets]);

  const slotRows = useMemo(() => {
    return parts.filter((p) => {
      // Hide placeholder entries for this TABLES/PARTS experience.
      if (p.identity.name === "(NOTHING)") return false;
      if (slot === "all") return true;
      if (slot === "rightArm") return p.baseStats.RightArm === true;
      if (slot === "leftArm") return p.baseStats.LeftArm === true;
      if (slot === "rightBack") return p.baseStats.RightBack === true;
      if (slot === "leftBack") return p.baseStats.LeftBack === true;
      const kindMap: Record<
        Exclude<SlotKey, "all" | "rightArm" | "leftArm" | "rightBack" | "leftBack">,
        string
      > = {
        head: "Head",
        core: "Core",
        arms: "Arms",
        legs: "Legs",
        booster: "Booster",
        fcs: "FCS",
        generator: "Generator",
        expansion: "Expansion",
      };
      return p.identity.kind === kindMap[slot];
    });
  }, [parts, slot]);

  const defaultColumns = useMemo(() => {
    if (partClass === "all") {
      return ["Name", "Kind", "Manufacturer", "Weight", "ENLoad", "AttackPower", "Impact"];
    }
    const kind = partClassToKind(partClass);
    const ordered = ["Name", ...(CLASSIC_PART_STAT_GROUPS[kind] ?? []).flat()];
    const available = new Set<string>();
    for (const p of slotRows) {
      available.add("Name");
      available.add("Kind");
      available.add("Manufacturer");
      for (const k of Object.keys(p.baseStats)) available.add(k);
    }
    return ordered.filter((k, i) => available.has(k) && ordered.indexOf(k) === i);
  }, [partClass, slotRows]);

  useEffect(() => {
    const kind = partClassToKind(partClass);
    setVisibleCols(defaultColumns);
    setColOrder(defaultColumns);
    const defaultVisible = (DEFAULT_VISIBLE_BY_KIND[kind] ?? defaultColumns).filter((c) =>
      defaultColumns.includes(c),
    );
    setVisibleCols(defaultVisible.length > 0 ? defaultVisible : defaultColumns);
    const defaultSort = (DEFAULT_SORT_BY_KIND[kind] ?? [{ key: "Name", dir: "asc" }]).filter(
      (s) => defaultColumns.includes(s.key),
    );
    setSorters(defaultSort.length > 0 ? defaultSort : [{ key: "Name", dir: "asc" }]);
    setColumnFilters({});
    setOpenFilterCol(null);
  }, [slot, defaultColumns, partClass]);

  const orderedVisibleCols = useMemo(
    () => colOrder.filter((k) => visibleCols.includes(k)),
    [colOrder, visibleCols],
  );

  const colToGroup = useMemo(() => {
    const kind = partClassToKind(partClass);
    const g = CLASSIC_PART_STAT_GROUPS[kind] ?? [];
    const m = new Map<string, number>();
    m.set("Name", -1);
    m.set("Kind", -1);
    m.set("Manufacturer", -1);
    for (let i = 0; i < g.length; i++) {
      for (const key of g[i] ?? []) m.set(key, i);
    }
    return m;
  }, [partClass]);

  const groupRuns = useMemo(() => {
    const runs: { label: string; span: number }[] = [];
    const kind = partClassToKind(partClass);
    const labels = GROUP_LABELS[kind] ?? [];
    let cur: string | null = null;
    let span = 0;
    for (const key of orderedVisibleCols) {
      const gi = colToGroup.get(key) ?? -1;
      const label = gi < 0 ? "Identity" : labels[gi] ?? `Group ${gi + 1}`;
      if (label === cur) {
        span++;
      } else {
        if (cur != null) runs.push({ label: cur, span });
        cur = label;
        span = 1;
      }
    }
    if (cur != null) runs.push({ label: cur, span });
    return runs;
  }, [orderedVisibleCols, colToGroup, partClass]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = slotRows.filter((p) => {
      if (!q) return true;
      const s = `${p.identity.name} ${p.identity.kind} ${p.identity.manufacturer ?? ""}`.toLowerCase();
      return s.includes(q);
    });
    const afterColumnFilters = filtered.filter((p) => {
      for (const [key, allowed] of Object.entries(columnFilters)) {
        if (!allowed || allowed.length === 0) continue;
        const val = fmt(getColValue(p, key));
        if (!allowed.includes(val)) return false;
      }
      return true;
    });
    afterColumnFilters.sort((a, b) => {
      for (const srt of sorters) {
        const av = getColValue(a, srt.key);
        const bv = getColValue(b, srt.key);
        const order = srt.dir === "asc" ? 1 : -1;
        if (
          typeof av === "number" ||
          typeof bv === "number" ||
          Array.isArray(av) ||
          Array.isArray(bv)
        ) {
          const na = resolveListValue(av);
          const nb = resolveListValue(bv);
          if (Number.isNaN(na) && Number.isNaN(nb)) continue;
          if (Number.isNaN(na)) return 1;
          if (Number.isNaN(nb)) return -1;
          if (na !== nb) return na > nb ? order : -order;
        } else {
          const cmp = String(av ?? "").localeCompare(String(bv ?? ""));
          if (cmp !== 0) return cmp * order;
        }
      }
      return 0;
    });
    return afterColumnFilters;
  }, [slotRows, query, sorters, columnFilters]);

  const toggleCol = (key: ColKey) => {
    setVisibleCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const setSort = (k: ColKey, additive: boolean) => {
    setSorters((prev) => {
      const idx = prev.findIndex((s) => s.key === k);
      if (!additive) {
        if (idx < 0) return [{ key: k, dir: "asc" }];
        const nextDir: SortDir = prev[idx]!.dir === "asc" ? "desc" : "asc";
        return [{ key: k, dir: nextDir }];
      }
      if (idx < 0) return [...prev, { key: k, dir: "asc" }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx]!, dir: copy[idx]!.dir === "asc" ? "desc" : "asc" };
      return copy;
    });
  };

  const applyPreset = (name: string) => {
    setSelectedPreset(name);
    const p = presets.find((x) => x.name === name);
    if (!p) return;
    setQuery(p.query);
    setSlot(p.slot);
    setVisibleCols(p.visibleCols);
    setColOrder(p.colOrder);
    setSorters(p.sorters.length ? p.sorters : [{ key: "Name", dir: "asc" }]);
    setColumnFilters(p.columnFilters ?? {});
  };

  const savePreset = () => {
    const name = window.prompt("Preset name");
    if (!name) return;
    const p: Preset = { name, query, slot, visibleCols, colOrder, sorters, columnFilters };
    setPresets((prev) => [...prev.filter((x) => x.name !== name), p]);
    setSelectedPreset(name);
  };

  const deletePreset = () => {
    if (!selectedPreset) return;
    setPresets((prev) => prev.filter((x) => x.name !== selectedPreset));
    setSelectedPreset("");
  };

  const onDropCol = (target: ColKey) => {
    if (!dragCol || dragCol === target) return;
    setColOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(dragCol);
      const to = next.indexOf(target);
      if (from < 0 || to < 0) return prev;
      next.splice(from, 1);
      next.splice(to, 0, dragCol);
      return next;
    });
    setDragCol(null);
  };

  const filterOptions = useMemo(() => {
    if (!openFilterCol) return [];
    const values = new Set<string>();
    for (const p of slotRows) values.add(fmt(getColValue(p, openFilterCol)));
    const needle = filterSearch.trim().toLowerCase();
    return [...values]
      .sort((a, b) => a.localeCompare(b))
      .filter((v) => (!needle ? true : v.toLowerCase().includes(needle)));
  }, [openFilterCol, slotRows, filterSearch]);

  const toggleFilterValue = (col: string, value: string) => {
    setColumnFilters((prev) => {
      const cur = prev[col] ?? [];
      const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
      return { ...prev, [col]: next };
    });
  };

  const clearFilter = (col: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[col];
      return next;
    });
  };

  const setAllCols = (nextOn: boolean) => {
    setVisibleCols(nextOn ? [...colOrder] : ["Name"]);
  };

  const setAllFilterOptions = (col: string, on: boolean) => {
    if (!on) {
      clearFilter(col);
      return;
    }
    const all = filterOptions;
    setColumnFilters((prev) => ({ ...prev, [col]: all }));
  };

  return (
    <div className="ac6-stack">
      <div className="ac6-strip">
        <p className="ac6-block-title leading-none">PART DATABASE</p>
      </div>

      <div className="ac6-block p-2">
        <div className="ac6-strip mb-1.5">
          <p className="ac6-chart-section-title m-0">PART SLOT FILTER</p>
        </div>
        <div className="flex flex-wrap gap-0.5">
          {SLOT_OPTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSlot(s.key)}
              className={`ac6-parts-slot-btn flex items-center gap-1 px-2 py-[3px] ${
                slot === s.key ? "ac6-parts-slot-btn-active" : ""
              }`}
            >
              {s.icon ? (
                <img
                  src={s.icon}
                  alt=""
                  className="h-4 w-4 object-contain"
                  aria-hidden
                />
              ) : null}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ac6-block p-2">
        <div className="ac6-strip mb-1.5">
          <p className="ac6-chart-section-title m-0">SEARCH &amp; PRESETS</p>
        </div>
        <div className="ac6-parts-toolbar-row">
          <div>
            <span className="ac6-parts-field-label">SEARCH</span>
            <input
              className="ac6-inset-field w-[min(100%,18rem)] px-2 py-[3px] text-[11px]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="NAME / MANUFACTURER"
              aria-label="Search parts by name or manufacturer"
            />
          </div>
          <div>
            <span className="ac6-parts-field-label">PRESET</span>
            <select
              className="ac6-inset-field min-w-[10rem] px-2 py-[3px] text-[11px]"
              value={selectedPreset}
              onChange={(e) => applyPreset(e.target.value)}
              aria-label="Load column preset"
            >
              <option value="">(NONE)</option>
              {presets.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="classic-tab text-[10px]"
            onClick={savePreset}
          >
            SAVE PRESET
          </button>
          <button
            type="button"
            className="classic-tab text-[10px] disabled:opacity-40"
            disabled={!selectedPreset}
            onClick={deletePreset}
          >
            DELETE
          </button>
          <p className="ac6-parts-count">{rows.length} SHOWN</p>
        </div>
      </div>

      <div className="ac6-block p-2">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="ac6-strip flex-1 px-2 py-[3px]">
            <p className="ac6-chart-section-title m-0">COLUMN VISIBILITY</p>
          </div>
          <div className="flex flex-wrap gap-0.5">
            <button
              type="button"
              className="classic-tab text-[10px]"
              onClick={() => setAllCols(true)}
            >
              ALL ON
            </button>
            <button
              type="button"
              className="classic-tab text-[10px]"
              onClick={() => setAllCols(false)}
            >
              NAME ONLY
            </button>
          </div>
        </div>
        <div className="ac6-inner-frame max-h-[9.5rem] overflow-y-auto p-1.5">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {colOrder.map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-1 text-[11px] text-cyan-100"
              >
                <input
                  type="checkbox"
                  className="accent-cyan-300"
                  checked={visibleCols.includes(key)}
                  onChange={() => toggleCol(key)}
                />
                <span className="font-semibold uppercase tracking-[0.04em]">
                  {toDisplayString(key)}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="ac6-block p-0">
        <div className="ac6-strip px-2 py-[3px]">
          <p className="ac6-chart-section-title m-0">PART TABLE</p>
        </div>
        <div
          className="ac6-table-wrap relative h-[min(72vh,780px)] overflow-auto"
          onMouseLeave={() => setPreviewPartId(null)}
        >
        <table className="w-full text-left text-[11px]">
          <thead className="ac6-table-headband ac6-table-thead sticky top-0 z-30">
            <tr className="ac6-table-group-row">
              {groupRuns.map((g, i) => (
                <th
                  key={`${g.label}-${i}`}
                  colSpan={g.span}
                  className="px-2 py-[3px] text-center text-[10px] font-bold uppercase tracking-[0.1em] text-cyan-200/75"
                >
                  {g.label}
                </th>
              ))}
            </tr>
            <tr className="ac6-table-col-header text-cyan-100">
              {orderedVisibleCols.map((k) => {
                const sortPos = sorters.findIndex((s) => s.key === k);
                const hasFilter = (columnFilters[k] ?? []).length > 0;
                return (
                  <th
                    key={k}
                    className={`relative overflow-visible px-2 py-[2px] ${
                      k === "Name" ? "ac6-table-name-sticky" : ""
                    }`}
                    style={{ minWidth: colWidth(k), width: colWidth(k) }}
                    draggable
                    onDragStart={() => setDragCol(k)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDropCol(k)}
                  >
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="ac6-table-sort"
                        onClick={(e) => setSort(k, e.shiftKey)}
                      >
                        {toDisplayString(k)}
                      </button>
                      {sortPos >= 0 ? (
                        <img
                          src={sorters[sortPos]!.dir === "asc" ? SORT_ASC_ICON : SORT_DESC_ICON}
                          alt={sorters[sortPos]!.dir === "asc" ? "Ascending" : "Descending"}
                          className="h-3 w-3 invert"
                        />
                      ) : null}
                      {sortPos > 0 ? (
                        <span className="text-[10px] text-cyan-200/75">{sortPos + 1}</span>
                      ) : null}
                      <button
                        type="button"
                        className={`px-[3px] py-0 text-[10px] ${
                          hasFilter ? "ac6-filter-chip-active" : "ac6-filter-chip-off"
                        }`}
                        onClick={() => {
                          setFilterSearch("");
                          setOpenFilterCol((cur) => (cur === k ? null : k));
                        }}
                        title="Filter values"
                      >
                        F
                      </button>
                    </div>
                    {openFilterCol === k ? (
                      <div className="ac6-filter-pop absolute left-0 top-full z-70 mt-1 w-64 p-2 shadow-xl">
                        <input
                          value={filterSearch}
                          onChange={(e) => setFilterSearch(e.target.value)}
                          className="ac6-inset-field mb-2 w-full px-2 py-1 text-[11px]"
                          placeholder="Search values..."
                        />
                        <div className="max-h-56 overflow-auto pr-1">
                          {filterOptions.map((v) => (
                            <label key={v} className="flex items-center gap-2 text-[11px] text-cyan-100">
                              <input
                                type="checkbox"
                                checked={(columnFilters[k] ?? []).includes(v)}
                                onChange={() => toggleFilterValue(k, v)}
                              />
                              <span className="truncate">{v}</span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-0.5">
                          <button
                            type="button"
                            className="classic-tab text-[10px]"
                            onClick={() => setAllFilterOptions(k, true)}
                          >
                            ALL
                          </button>
                          <button
                            type="button"
                            className="classic-tab text-[10px]"
                            onClick={() => setAllFilterOptions(k, false)}
                          >
                            NONE
                          </button>
                          <button
                            type="button"
                            className="classic-tab text-[10px]"
                            onClick={() => clearFilter(k)}
                          >
                            CLEAR
                          </button>
                          <button
                            type="button"
                            className="classic-tab text-[10px]"
                            onClick={() => setOpenFilterCol(null)}
                          >
                            CLOSE
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr
                key={`${p.identity.id}-${p.identity.name}`}
                className={`ac6-table-row text-cyan-50/90 ${
                  i % 2 ? "ac6-table-row-even" : "ac6-table-row-odd"
                }`}
                onMouseEnter={() => setPreviewPartId(p.identity.id)}
              >
                {orderedVisibleCols.map((k) => {
                  const raw = getColValue(p, k);
                  const text = fmt(raw);
                  if (k === "Name") {
                    return (
                      <td
                        key={k}
                        className="ac6-table-name-sticky px-2 py-[2px]"
                        style={{ minWidth: colWidth(k), width: colWidth(k) }}
                      >
                        <div className="flex items-center gap-1.5">
                          <PartThumbnail
                            partName={p.identity.name}
                            size="sm"
                          />
                          <span className="font-semibold uppercase tracking-[0.04em]">
                            {text}
                          </span>
                        </div>
                      </td>
                    );
                  }
                  if (k === "Manufacturer" && typeof raw === "string") {
                    return (
                      <td
                        key={k}
                        className="px-2 py-[2px] font-mono tabular-nums"
                        style={{ minWidth: colWidth(k), width: colWidth(k) }}
                      >
                        <div className="flex items-center gap-1.5">
                          <ManufacturerThumbnail manufacturer={raw} />
                          <span>{text}</span>
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td
                      key={k}
                      className={`px-2 py-[2px] font-mono tabular-nums`}
                      style={{ minWidth: colWidth(k), width: colWidth(k) }}
                    >
                      {text}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
