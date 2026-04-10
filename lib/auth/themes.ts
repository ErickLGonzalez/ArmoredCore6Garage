export const THEME_VALUES = [
  "BLACK",
  "CATPPUCCIN_FRAPPE",
  "CATPPUCCIN_LATTE",
  "CATPPUCCIN_MACCHIATO",
  "CATPPUCCIN_MOCHA",
  "DEFAULT",
  "DRACULA",
  "FROSTY",
  "GRUVBOX_DARK",
  "GRUVBOX_LIGHT",
  "ONE_DARK",
  "ROSE_PINE",
  "ROSE_PINE_DAWN",
  "ROSE_PINE_MOON",
  "SOLARIZED_DARK",
  "TOKYONIGHT",
  "WHITE",
] as const;

export type UiThemeName = (typeof THEME_VALUES)[number];

export const DEFAULT_THEME: UiThemeName = "TOKYONIGHT";

export function isThemeName(v: string): v is UiThemeName {
  return (THEME_VALUES as readonly string[]).includes(v);
}

export function resolveTheme(v: string | null | undefined): UiThemeName {
  if (!v) return DEFAULT_THEME;
  return isThemeName(v) ? v : DEFAULT_THEME;
}

export function themeLabel(theme: UiThemeName): string {
  return theme.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
