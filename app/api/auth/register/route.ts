import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_THEME } from "@/lib/auth/themes";
import { hashPassword } from "@/lib/auth/password";
import { issueSession, SESSION_COOKIE, THEME_COOKIE } from "@/lib/auth/session";
import { AuthRegisterSchema } from "@/lib/dto/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = AuthRegisterSchema.parse(await req.json());
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }
  const passwordHash = hashPassword(body.password);
  const user = await prisma.user.create({
    data: {
      email: body.email,
      displayName: body.displayName,
      passwordHash,
      theme: DEFAULT_THEME,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      theme: true,
    },
  });
  const { token, expiresAt } = await issueSession(user.id);
  const res = NextResponse.json({ user }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  res.cookies.set(THEME_COOKIE, user.theme, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return res;
}
