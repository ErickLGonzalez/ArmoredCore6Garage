import { NextResponse, type NextRequest } from "next/server";

import { getSessionUser, SESSION_COOKIE, THEME_COOKIE } from "@/lib/auth/session";
import { ThemeUpdateSchema } from "@/lib/dto/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = ThemeUpdateSchema.parse(await req.json());
  await prisma.user.update({
    where: { id: user.id },
    data: { theme: body.theme },
  });
  const res = NextResponse.json({ ok: true, theme: body.theme });
  res.cookies.set(THEME_COOKIE, body.theme, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
