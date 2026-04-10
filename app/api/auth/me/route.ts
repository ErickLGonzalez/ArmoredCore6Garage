import { NextResponse, type NextRequest } from "next/server";

import { getSessionUser, SESSION_COOKIE } from "@/lib/auth/session";
import { THEME_VALUES } from "@/lib/auth/themes";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  return NextResponse.json({
    user: user
      ? {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          theme: user.theme,
        }
      : null,
    themes: THEME_VALUES,
  });
}
