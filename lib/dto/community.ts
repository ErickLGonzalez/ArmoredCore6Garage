import { z } from "zod";

export const CommunityBuildCreateSchema = z.object({
  buildId: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().min(1).max(32)).max(12).default([]),
});
