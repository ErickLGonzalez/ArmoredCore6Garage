import { readFile } from "node:fs/promises";
import path from "node:path";

import { DEFAULT_THEME, resolveTheme, THEME_FILE_BY_NAME, type UiThemeName } from "@/lib/auth/themes";

const THEME_KEYS = [
  "ui_bg_top",
  "ui_bg_bottom",
  "ui_panel_top",
  "ui_panel_bottom",
  "ui_border",
  "ui_border_strong",
  "ui_text",
  "ui_text_dim",
  "ui_tab_top",
  "ui_tab_bottom",
  "ui_tab_active_top",
  "ui_tab_active_bottom",
  "ui_tab_active_text",
] as const;

const OPTIONAL_THEME_KEYS = [
  "ui_accent_danger",
  "ui_accent_compare",
  "ui_accent_positive",
] as const;

type ThemeKey = (typeof THEME_KEYS)[number];
type OptionalThemeKey = (typeof OPTIONAL_THEME_KEYS)[number];
export type ThemeTokens = Record<ThemeKey | OptionalThemeKey, string>;
export type ThemeCssVars = Record<string, string>;

const cache = new Map<UiThemeName, ThemeTokens>();

const OPTIONAL_DEFAULTS: Record<OptionalThemeKey, string> = {
  ui_accent_danger: "#ef4444",
  ui_accent_compare: "#f59e0b",
  ui_accent_positive: "#86efac",
};

function parseSimpleYamlObject(input: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const lineRaw of input.split(/\r?\n/)) {
    const line = lineRaw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function toThemeTokens(obj: Record<string, string>): ThemeTokens {
  const missing = THEME_KEYS.filter((k) => !obj[k]);
  if (missing.length > 0) {
    throw new Error(`Theme file missing keys: ${missing.join(", ")}`);
  }
  const tokens = { ...OPTIONAL_DEFAULTS } as ThemeTokens;
  for (const key of THEME_KEYS) tokens[key] = obj[key];
  for (const key of OPTIONAL_THEME_KEYS) {
    if (obj[key]) tokens[key] = obj[key];
  }
  return tokens;
}

export function tokensToCssVars(tokens: ThemeTokens): ThemeCssVars {
  return {
    "--ui-bg-top": tokens.ui_bg_top,
    "--ui-bg-bottom": tokens.ui_bg_bottom,
    "--ui-panel-top": tokens.ui_panel_top,
    "--ui-panel-bottom": tokens.ui_panel_bottom,
    "--ui-border": tokens.ui_border,
    "--ui-border-strong": tokens.ui_border_strong,
    "--ui-text": tokens.ui_text,
    "--ui-text-dim": tokens.ui_text_dim,
    "--ui-tab-top": tokens.ui_tab_top,
    "--ui-tab-bottom": tokens.ui_tab_bottom,
    "--ui-tab-active-top": tokens.ui_tab_active_top,
    "--ui-tab-active-bottom": tokens.ui_tab_active_bottom,
    "--ui-tab-active-text": tokens.ui_tab_active_text,
    "--ui-accent-danger": tokens.ui_accent_danger,
    "--ui-accent-compare": tokens.ui_accent_compare,
    "--ui-accent-positive": tokens.ui_accent_positive,
  };
}

export async function loadThemeTokens(themeName: string | null | undefined): Promise<ThemeTokens> {
  const theme = resolveTheme(themeName);
  const cached = cache.get(theme);
  if (cached) return cached;
  const fileName = THEME_FILE_BY_NAME[theme];
  const filePath = path.join(process.cwd(), "themes", fileName);
  try {
    const raw = await readFile(filePath, "utf8");
    const tokens = toThemeTokens(parseSimpleYamlObject(raw));
    cache.set(theme, tokens);
    return tokens;
  } catch {
    if (theme !== DEFAULT_THEME) return loadThemeTokens(DEFAULT_THEME);
    throw new Error(`Unable to load default theme file: ${filePath}`);
  }
}
