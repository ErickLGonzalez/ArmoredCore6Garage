import { z } from "zod";

import { PartStatValueSchema } from "./stat-value";

export const PartIdentitySchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string().min(1),
  kind: z.string().min(1),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
});

export type PartIdentity = z.infer<typeof PartIdentitySchema>;

export const CanonicalPartSchema = z.object({
  identity: PartIdentitySchema,
  baseStats: z.record(z.string(), PartStatValueSchema),
  enrichedStats: z.record(z.string(), z.unknown()).default({}),
  scalingModels: z.record(z.string(), PartStatValueSchema).default({}),
  metadata: z.object({
    sourceFile: z.string(),
    sourceIndex: z.number().int().nonnegative(),
    rawFieldCount: z.number().int().nonnegative(),
    schemaVersion: z.literal("1.0.0"),
  }),
});

export type CanonicalPart = z.infer<typeof CanonicalPartSchema>;
