import { NextResponse, type NextRequest } from "next/server";

import { getSessionUser, SESSION_COOKIE, THEME_COOKIE } from "@/lib/auth/session";
import { resolveTheme, THEME_VALUES } from "@/lib/auth/themes";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  const effectiveTheme = resolveTheme(req.cookies.get(THEME_COOKIE)?.value ?? user?.theme);
  return NextResponse.json({
    user: user
      ? {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          theme: effectiveTheme,
        }
      : null,
    themes: THEME_VALUES,
  });
}
