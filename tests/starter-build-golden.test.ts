import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { analyzeBuild } from "@/lib/calc";
import type { AssemblySlot, BuildAssembly } from "@/lib/calc/types";
import { assemblyFromGarageIds } from "@/lib/garage/assembly-from-ids";
import { defaultGarageSelection } from "@/lib/garage/default-assembly";
import { getEnergyRecoveryCurves } from "@/lib/garage/plot-data";
import type { CanonicalPart } from "@/lib/schema";
import { MergedDatasetSchema } from "@/lib/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MERGED = path.join(__dirname, "..", "data", "parts.merged.json");

/** Same starter rows as `calc.test.ts` plus `(NOTHING)` expansion. */
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

describe("starter build golden (garage IDs path)", () => {
  it("matches manual starter + expansion assembly from merged data", () => {
    const raw = readFileSync(MERGED, "utf-8");
    const data = MergedDatasetSchema.parse(JSON.parse(raw));
    const manual: BuildAssembly = {};
    for (const [slot, name, kind] of STARTER) {
      manual[slot] = findPart(data.parts, name, kind);
    }
    manual.expansion = findPart(data.parts, "(NOTHING)", "Expansion");

    const ids = defaultGarageSelection(data.parts);
    expect(ids).not.toBeNull();
    const byId = new Map(data.parts.map((p) => [p.identity.id, p] as const));
    const fromGarage = assemblyFromGarageIds(ids!, byId);
    expect(fromGarage).not.toBeNull();

    const rManual = analyzeBuild(manual);
    const rGarage = analyzeBuild(fromGarage!);
    expect(rGarage.totalWeight).toBe(rManual.totalWeight);
    expect(rGarage.totalEnLoad).toBe(rManual.totalEnLoad);
    expect(rGarage.totalAp).toBe(rManual.totalAp);
    expect(rGarage.dps).toBe(rManual.dps);
    expect(rGarage.burstDps).toBe(rManual.burstDps);
  });

  it("exposes EN recovery curves for the default garage build", () => {
    const raw = readFileSync(MERGED, "utf-8");
    const data = MergedDatasetSchema.parse(JSON.parse(raw));
    const ids = defaultGarageSelection(data.parts);
    expect(ids).not.toBeNull();
    const byId = new Map(data.parts.map((p) => [p.identity.id, p] as const));
    const assembly = assemblyFromGarageIds(ids!, byId);
    expect(assembly).not.toBeNull();
    const r = analyzeBuild(assembly!);
    const curves = getEnergyRecoveryCurves(r.groups);
    expect(curves).not.toBeNull();
    expect(curves!.normal.t).toEqual([expect.any(Number), expect.any(Number), expect.any(Number)]);
    expect(curves!.redline.t.length).toBe(3);
    expect(curves!.normal.en[2]).toBeGreaterThan(0);
    expect(curves!.redline.en[2]).toBeGreaterThan(0);
  });
});
