import { NextResponse, type NextRequest } from "next/server";

import { revokeSession, SESSION_COOKIE, THEME_COOKIE } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  await revokeSession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    path: "/",
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.cookies.set(THEME_COOKIE, "", {
    path: "/",
    expires: new Date(0),
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
