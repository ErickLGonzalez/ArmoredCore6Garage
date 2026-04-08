import { NextResponse } from "next/server";

import { OptimizerRequestSchema } from "@/lib/dto/optimizer";
import { optimizeAdvanced } from "@/src/lib/optimizer";

export async function POST(req: Request) {
  const body = OptimizerRequestSchema.parse(await req.json());
  const result = optimizeAdvanced(
    { goal: body.goal, limit: body.limit },
    body.candidates,
  );
  return NextResponse.json(result);
}
