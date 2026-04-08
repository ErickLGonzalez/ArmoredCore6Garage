import { NextResponse } from "next/server";

import { MetaRankingCreateSchema } from "@/lib/dto/meta";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const patchVersion = url.searchParams.get("patchVersion") ?? "1.0.9";
  const rows = await prisma.metaRanking.findMany({
    where: { patchVersion },
    orderBy: [{ score: "desc" }],
    take: 100,
  });
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const body = MetaRankingCreateSchema.parse(await req.json());
  const row = await prisma.metaRanking.create({
    data: body,
  });
  return NextResponse.json(row, { status: 201 });
}
