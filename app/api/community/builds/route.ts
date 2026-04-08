import { NextResponse } from "next/server";

import { CommunityBuildCreateSchema } from "@/lib/dto/community";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.communityBuild.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const body = CommunityBuildCreateSchema.parse(await req.json());
  const row = await prisma.communityBuild.create({
    data: {
      buildId: body.buildId,
      title: body.title,
      description: body.description,
      tags: body.tags,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
