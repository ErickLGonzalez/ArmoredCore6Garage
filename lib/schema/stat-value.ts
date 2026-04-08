import { z } from "zod";

/** Values allowed on AC6 part records in source JSON. */
export const PartStatValueSchema = z.union([
  z.number(),
  z.boolean(),
  z.string(),
  z.array(z.union([z.number(), z.string()])),
  z.null(),
]);

export type PartStatValue = z.infer<typeof PartStatValueSchema>;
