import { NextResponse, type NextRequest } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import { issueSession, SESSION_COOKIE, THEME_COOKIE } from "@/lib/auth/session";
import { AuthLoginSchema } from "@/lib/dto/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = AuthLoginSchema.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const ok = verifyPassword(body.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const { token, expiresAt } = await issueSession(user.id);
  const res = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      theme: user.theme,
    },
  });
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
