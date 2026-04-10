import { NextResponse } from "next/server";

import { isThemeName } from "@/lib/auth/themes";
import { loadThemeTokens, tokensToCssVars } from "@/lib/themes/theme-loader";

type Params = {
  params: Promise<{ theme: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const p = await params;
  const theme = p.theme.toUpperCase();
  if (!isThemeName(theme)) {
    return NextResponse.json({ error: "Unknown theme" }, { status: 404 });
  }
  const tokens = await loadThemeTokens(theme);
  return NextResponse.json({ theme, cssVars: tokensToCssVars(tokens), tokens });
}
