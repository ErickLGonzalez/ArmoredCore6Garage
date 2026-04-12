import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { analyzeBuild } from "@/lib/calc";
import { applyModifiedUnitsToLegacyMap } from "@/lib/calc/apply-modified-unit-map";
import { assemblyToLegacyMap } from "@/lib/calc/assembly-map";
import type { AssemblySlot, BuildAssembly } from "@/lib/calc/types";
import { normalizeRawPart } from "@/lib/data/normalize-part";
import type { CanonicalPart } from "@/lib/schema";
import { MergedDatasetSchema } from "@/lib/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MERGED = path.join(__dirname, "..", "data", "parts.merged.json");

function findPart(
  parts: CanonicalPart[],
  name: string,
  kind: string,
): CanonicalPart {
  const p = parts.find(
    (x) => x.identity.name === name && x.identity.kind === kind,
  );
  if (!p) throw new Error(`Missing part ${name} (${kind})`);
  return p;
}

/** Default garage from reference BuildImportExport.starterAssembly (11 compute slots). */
const STARTER: [AssemblySlot, string, string][] = [
  ["rightArm", "RF-024 TURNER", "Unit"],
  ["leftArm", "HI-32: BU-TT/A", "Unit"],
  ["rightBack", "BML-G1/P20MLT-04", "Unit"],
  ["leftBack", "(NOTHING)", "Unit"],
  ["head", "HC-2000 FINDER EYE", "Head"],
  ["core", "CC-2000 ORBITER", "Core"],
  ["arms", "AC-2000 TOOL ARM", "Arms"],
  ["legs", "2C-2000 CRAWLER", "Legs"],
  ["booster", "BST-G1/P10", "Booster"],
  ["fcs", "FCS-G1/P01", "FCS"],
  ["generator", "AG-J-098 JOSO", "Generator"],
];

describe("analyzeBuild", () => {
  it("sums weight and EN load across two minimal parts", () => {
    const a = normalizeRawPart(
      { Name: "A", Kind: "Head", Weight: 1000, ENLoad: 50, AP: 100 },
      0,
      "t.json",
    );
    const b = normalizeRawPart(
      { Name: "B", Kind: "Core", Weight: 2000, ENLoad: 150, AP: 200 },
      1,
      "t.json",
    );
    const r = analyzeBuild({
      rightArm: normalizeRawPart(
        { Name: "U1", Kind: "Unit", Weight: 0, ENLoad: 0 },
        0,
        "t.json",
      ),
      leftArm: normalizeRawPart(
        { Name: "U2", Kind: "Unit", Weight: 0, ENLoad: 0 },
        1,
        "t.json",
      ),
      rightBack: normalizeRawPart(
        { Name: "U3", Kind: "Unit", Weight: 0, ENLoad: 0 },
        2,
        "t.json",
      ),
      leftBack: normalizeRawPart(
        { Name: "U4", Kind: "Unit", Weight: 0, ENLoad: 0 },
        3,
        "t.json",
      ),
      head: a,
      core: b,
      arms: normalizeRawPart(
        {
          Name: "Arms",
          Kind: "Arms",
          Weight: 0,
          ENLoad: 0,
          ArmsLoadLimit: 10000,
          RecoilControl: 100,
          FirearmSpecialization: 100,
        },
        2,
        "t.json",
      ),
      legs: normalizeRawPart(
        {
          Name: "Legs",
          Kind: "Legs",
          Weight: 500,
          ENLoad: 0,
          LoadLimit: 50000,
          LegType: "Bipedal",
          AP: 50,
          AntiKineticDefense: 100,
          AntiEnergyDefense: 100,
          AntiExplosiveDefense: 100,
          AttitudeStability: 100,
        },
        3,
        "t.json",
      ),
      booster: normalizeRawPart(
        {
          Name: "Booster",
          Kind: "Booster",
          Weight: 0,
          ENLoad: 0,
          Thrust: 100,
          QBThrust: 100,
          UpwardThrust: 100,
          ABThrust: 100,
          MeleeAttackThrust: 100,
          QBReloadTime: 1,
          QBReloadIdealWeight: 0,
          QBENConsumption: 100,
          QBJetDuration: 0.1,
          UpwardENConsumption: 1,
          ABENConsumption: 1,
        },
        4,
        "t.json",
      ),
      fcs: normalizeRawPart(
        {
          Name: "FCS",
          Kind: "FCS",
          Weight: 0,
          ENLoad: 0,
          CloseRangeAssist: 0,
          MediumRangeAssist: 0,
          LongRangeAssist: 0,
        },
        5,
        "t.json",
      ),
      generator: normalizeRawPart(
        {
          Name: "Gen",
          Kind: "Generator",
          Weight: 0,
          ENLoad: 0,
          ENCapacity: 10000,
          ENOutput: 10000,
          ENRecharge: 100,
          SupplyRecovery: 100,
          PostRecoveryENSupply: 0,
        },
        6,
        "t.json",
      ),
    });
    expect(r.totalWeight).toBe(3500);
    expect(r.totalEnLoad).toBe(200);
  });

  it("matches legacy starter total weight from merged dataset", () => {
    const raw = readFileSync(MERGED, "utf-8");
    const data = MergedDatasetSchema.parse(JSON.parse(raw));
    const assembly: BuildAssembly = {};
    for (const [slot, name, kind] of STARTER) {
      assembly[slot] = findPart(data.parts, name, kind);
    }
    const r = analyzeBuild(assembly);
    expect(r.totalWeight).toBeGreaterThan(50_000);
    expect(r.totalEnLoad).toBeGreaterThan(1000);
    expect(r.totalAp).toBeGreaterThan(1000);
    expect(r.groundedBoostSpeed).toBeGreaterThan(0);
  });

  it("applyModifiedUnitsToLegacyMap scales IsMeleeSpec unit attack stats from arms melee specialization", () => {
    const raw = readFileSync(MERGED, "utf-8");
    const data = MergedDatasetSchema.parse(JSON.parse(raw));
    const assembly: BuildAssembly = {};
    for (const [slot, name, kind] of STARTER) {
      assembly[slot] = findPart(data.parts, name, kind);
    }
    const lowArms = findPart(data.parts, "AC-3000 WRECKER", "Arms");
    const hiArms = findPart(data.parts, "AA-J-123 BASHO", "Arms");
    const mLow = applyModifiedUnitsToLegacyMap(
      assemblyToLegacyMap({ ...assembly, arms: lowArms }),
    );
    const mHi = applyModifiedUnitsToLegacyMap(
      assemblyToLegacyMap({ ...assembly, arms: hiArms }),
    );
    const laLow = mLow.leftArm?.AttackPower;
    const laHi = mHi.leftArm?.AttackPower;
    expect(typeof laLow).toBe("number");
    expect(typeof laHi).toBe("number");
    expect((laHi as number) / (laLow as number)).toBeGreaterThan(1.05);
  });

  it("starter + merged (NOTHING) expansion yields finite weight/EN and non-zero DPS", () => {
    const raw = readFileSync(MERGED, "utf-8");
    const data = MergedDatasetSchema.parse(JSON.parse(raw));
    const assembly: BuildAssembly = {};
    for (const [slot, name, kind] of STARTER) {
      assembly[slot] = findPart(data.parts, name, kind);
    }
    assembly.expansion = findPart(data.parts, "(NOTHING)", "Expansion");
    const r = analyzeBuild(assembly);
    expect(Number.isFinite(r.totalWeight)).toBe(true);
    expect(Number.isFinite(r.totalEnLoad)).toBe(true);
    expect(r.totalWeight).toBeGreaterThan(50_000);
    expect(r.dps).toBeGreaterThan(200);
    const recGraph = r.groups[1]?.find(
      (s) => s.name === "RecoilAccumulationGraph",
    )?.value;
    expect(Array.isArray(recGraph)).toBe(true);
    expect((recGraph as unknown[]).length).toBeGreaterThan(0);
    const avgRec = Number(
      r.groups[1]?.find((s) => s.name === "AverageRecoil")?.value ?? NaN,
    );
    expect(Number.isFinite(avgRec)).toBe(true);
  });
});
