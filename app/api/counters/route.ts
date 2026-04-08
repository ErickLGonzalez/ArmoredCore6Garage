import { NextResponse } from "next/server";

import { CountersRequestSchema } from "@/lib/dto/optimizer";
import { generateCounterBuilds } from "@/src/lib/counters";

export async function POST(req: Request) {
  const body = CountersRequestSchema.parse(await req.json());
  const result = generateCounterBuilds(
    body.enemy,
    body.candidates,
    body.limit ?? 8,
  );
  return NextResponse.json(result);
}
