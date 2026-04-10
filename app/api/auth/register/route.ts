import { NextResponse, type NextRequest } from "next/server";

import {
  DEV_FALLBACK_USERNAME,
  isDevFallbackCredentials,
  makeDevUser,
} from "@/lib/auth/dev-fallback";
import { DEFAULT_THEME } from "@/lib/auth/themes";
import { hashPassword } from "@/lib/auth/password";
import { issueDevSession, issueSession, SESSION_COOKIE, THEME_COOKIE } from "@/lib/auth/session";
import { AuthRegisterSchema } from "@/lib/dto/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = AuthRegisterSchema.parse(await req.json());
  try {
    const existingByUsername = await prisma.user.findUnique({ where: { username: body.username } });
    if (existingByUsername) {
      return NextResponse.json({ error: "Username already registered" }, { status: 409 });
    }
    if (body.email) {
      const existingByEmail = await prisma.user.findUnique({ where: { email: body.email } });
      if (existingByEmail) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
    }
    const passwordHash = hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email,
        displayName: body.displayName,
        passwordHash,
        theme: DEFAULT_THEME,
      },
      select: {
        id: true,
        username: true,
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
  } catch {
    if (
      body.username === DEV_FALLBACK_USERNAME &&
      isDevFallbackCredentials(body.username, body.password)
    ) {
      const devUser = makeDevUser();
      const { token, expiresAt } = issueDevSession(devUser.username);
      const res = NextResponse.json({ user: devUser }, { status: 201 });
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: expiresAt,
      });
      res.cookies.set(THEME_COOKIE, devUser.theme, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: expiresAt,
      });
      return res;
    }
    return NextResponse.json({ error: "Registration service unavailable" }, { status: 503 });
  }
}
