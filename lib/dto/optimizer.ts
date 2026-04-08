import { z } from "zod";

const CandidateSchema = z.object({
  build: z.unknown(),
  metrics: z.object({
    dps: z.number().finite(),
    stagger: z.number().finite(),
    mobility: z.number().finite(),
  }),
});

export const OptimizerRequestSchema = z.object({
  goal: z.enum(["max_dps", "max_stagger", "max_mobility", "balanced"]),
  limit: z.number().int().min(1).max(50).optional(),
  candidates: z.array(CandidateSchema).min(1),
});

const CounterCandidateSchema = z.object({
  build: z.unknown(),
  dps: z.number().finite(),
  impactPerSecond: z.number().finite(),
  mobility: z.number().finite(),
});

export const CountersRequestSchema = z.object({
  enemy: z.object({
    totalAp: z.number().positive(),
    totalStability: z.number().positive(),
    groundedBoostSpeed: z.number().positive(),
  }),
  candidates: z.array(CounterCandidateSchema).min(1),
  limit: z.number().int().min(1).max(25).optional(),
});

export const BattleSimRequestSchema = z.object({
  buildA: z.object({
    ap: z.number().positive(),
    dps: z.number().nonnegative(),
    impactPerSecond: z.number().nonnegative(),
    stability: z.number().positive(),
  }),
  buildB: z.object({
    ap: z.number().positive(),
    dps: z.number().nonnegative(),
    impactPerSecond: z.number().nonnegative(),
    stability: z.number().positive(),
  }),
});
