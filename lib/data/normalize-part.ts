import type { PartStatValue } from "@/lib/schema/stat-value";
import type { CanonicalPart } from "@/lib/schema/canonical-part";

import { normalizePartName } from "./name-normalize";
import { isScalingModelKey } from "./scaling-keys";

const IDENTITY_SOURCE_KEYS = [
  "Name",
  "Kind",
  "Manufacturer",
  "Description",
] as const;

const PATCH_VERSION = "1.0.9" as const;
const SOURCE_VERSION = "repo-1.0.9" as const;
const SPREADSHEET_VERSION = "1.0.7" as const;

function asStatValue(value: unknown): PartStatValue {
  if (value === null) return null;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v) =>
      typeof v === "number" || typeof v === "string" ? v : String(v),
    ) as PartStatValue;
  }
  return String(value);
}

/**
 * Map one raw AC6 part object (legacy JSON shape) into the MasterofArena canonical record.
 */
export function normalizeRawPart(
  raw: Record<string, unknown>,
  sourceIndex: number,
  sourceFile: string,
): CanonicalPart {
  const nameRaw = raw.Name;
  const kindRaw = raw.Kind;
  if (nameRaw == null || kindRaw == null) {
    throw new Error(`Part at index ${sourceIndex} missing Name or Kind`);
  }

  const idFromRow =
    typeof raw.ID === "number" && Number.isFinite(raw.ID) ? raw.ID : sourceIndex;

  const identity = {
    id: idFromRow,
    name: normalizePartName(String(nameRaw)),
    kind: String(kindRaw).trim(),
    manufacturer:
      raw.Manufacturer != null ? String(raw.Manufacturer).trim() : undefined,
    description:
      raw.Description != null ? String(raw.Description).trim() : undefined,
  };

  const baseStats: Record<string, PartStatValue> = {};
  const scalingModels: Record<string, PartStatValue> = {};

  for (const [key, value] of Object.entries(raw)) {
    if ((IDENTITY_SOURCE_KEYS as readonly string[]).includes(key)) continue;
    if (key === "ID") continue;
    const v = asStatValue(value);
    if (isScalingModelKey(key)) scalingModels[key] = v;
    else baseStats[key] = v;
  }

  return {
    identity,
    baseStats,
    enrichedStats: {},
    scalingModels,
    metadata: {
      sourceFile,
      sourceIndex,
      rawFieldCount: Object.keys(raw).length,
      schemaVersion: "1.0.0",
      patchVersion: PATCH_VERSION,
      sourceVersion: SOURCE_VERSION,
      spreadsheetVersion: SPREADSHEET_VERSION,
      overrideSources: [SOURCE_VERSION],
    },
  };
}
