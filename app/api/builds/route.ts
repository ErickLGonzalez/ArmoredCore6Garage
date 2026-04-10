import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { BuildCreateInputSchema, BuildListQuerySchema } from "@/lib/dto/build";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = BuildListQuerySchema.parse({
    limit: url.searchParams.get("limit") ?? undefined,
  });
  const rows = await prisma.build.findMany({
    take: q.limit,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const body = BuildCreateInputSchema.parse(await req.json());
  const row = await prisma.build.create({
    data: {
      name: body.name,
      code: body.code,
      summary: body.summary as Prisma.InputJsonValue | undefined,
      visibility: body.visibility,
      patchVersion: body.patchVersion,
      buildMetadata: body.buildMetadata as Prisma.InputJsonValue | undefined,
      userId: body.userId,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
