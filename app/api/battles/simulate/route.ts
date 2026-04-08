import { NextResponse } from "next/server";

import { BattleSimRequestSchema } from "@/lib/dto/optimizer";
import { simulateBattle } from "@/src/lib/battle";

export async function POST(req: Request) {
  const body = BattleSimRequestSchema.parse(await req.json());
  const result = simulateBattle(body.buildA, body.buildB);
  return NextResponse.json(result);
}
