import { z } from "zod";

export const BattleResultCreateSchema = z.object({
  buildAId: z.string().min(1),
  buildBId: z.string().min(1),
  winnerBuildId: z.string().min(1).nullable(),
  durationSec: z.number().nonnegative(),
  summary: z.record(z.string(), z.unknown()).optional(),
});
