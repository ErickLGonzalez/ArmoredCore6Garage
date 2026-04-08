import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { BattleResultCreateSchema } from "@/lib/dto/battle";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.battleResult.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const body = BattleResultCreateSchema.parse(await req.json());
  const row = await prisma.battleResult.create({
    data: {
      buildAId: body.buildAId,
      buildBId: body.buildBId,
      winnerBuildId: body.winnerBuildId,
      durationSec: body.durationSec,
      summary: body.summary as Prisma.InputJsonValue | undefined,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
