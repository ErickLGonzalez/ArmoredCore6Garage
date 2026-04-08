import { z } from "zod";

import { CanonicalPartSchema } from "./canonical-part";

export const MergedDatasetSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  generatedAt: z.string(),
  source: z.string(),
  partCount: z.number().int().nonnegative(),
  parts: z.array(CanonicalPartSchema),
});

export type MergedDataset = z.infer<typeof MergedDatasetSchema>;
