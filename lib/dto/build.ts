import { z } from "zod";

export const BuildCreateInputSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(500),
  summary: z.record(z.string(), z.unknown()).optional(),
  userId: z.string().min(1).optional(),
});

export const BuildListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
