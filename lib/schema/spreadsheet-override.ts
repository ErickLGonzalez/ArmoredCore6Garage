import { z } from "zod";

/** One row from an exported Google Sheet (or CSV) for stat overrides. */
export const SpreadsheetOverrideRowSchema = z.object({
  partName: z.string().min(1),
  field: z.string().min(1),
  value: z.union([z.number(), z.string(), z.boolean()]),
});

export type SpreadsheetOverrideRow = z.infer<
  typeof SpreadsheetOverrideRowSchema
>;

export const SpreadsheetOverrideFileSchema = z.array(
  SpreadsheetOverrideRowSchema,
);
