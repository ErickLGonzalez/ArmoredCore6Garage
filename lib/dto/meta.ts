import { z } from "zod";

export const MetaRankingCreateSchema = z.object({
  buildId: z.string().min(1),
  score: z.number().finite(),
  winRate: z.number().min(0).max(1),
  tier: z.string().min(1).max(16),
  patchVersion: z.string().min(1).default("1.0.9"),
});
