export const THEME_VALUES = [
  "BLACK",
  "CATPPUCCIN_FRAPPE",
  "CATPPUCCIN_LATTE",
  "CATPPUCCIN_MACCHIATO",
  "CATPPUCCIN_MOCHA",
  "DEFAULT",
  "DRACULA",
  "FIRE",
  "FOREST",
  "FROSTY",
  "GRUVBOX_DARK",
  "GRUVBOX_LIGHT",
  "ONE_DARK",
  "OCEAN",
  "ROSE_PINE",
  "ROSE_PINE_DAWN",
  "ROSE_PINE_MOON",
  "ROSE_STONE",
  "SOLARIZED_DARK",
  "TOKYONIGHT",
  "WHITE",
] as const;

export type UiThemeName = (typeof THEME_VALUES)[number];

export const DEFAULT_THEME: UiThemeName = "DEFAULT";

export const THEME_FILE_BY_NAME: Record<UiThemeName, string> = {
  BLACK: "black.yml",
  CATPPUCCIN_FRAPPE: "catppuccin-frappe.yml",
  CATPPUCCIN_LATTE: "catppuccin-latte.yml",
  CATPPUCCIN_MACCHIATO: "catppuccin-macchiato.yml",
  CATPPUCCIN_MOCHA: "catppuccin-mocha.yml",
  DEFAULT: "default.yml",
  DRACULA: "dracula.yml",
  FIRE: "fire.yml",
  FOREST: "forest.yml",
  FROSTY: "frosty.yml",
  GRUVBOX_DARK: "gruvbox-dark.yml",
  GRUVBOX_LIGHT: "gruvbox-light.yml",
  ONE_DARK: "one_dark.yml",
  OCEAN: "ocean.yml",
  ROSE_PINE: "rose-pine.yml",
  ROSE_PINE_DAWN: "rose-pine-dawn.yml",
  ROSE_PINE_MOON: "rose-pine-moon.yml",
  ROSE_STONE: "rose-stone.yml",
  SOLARIZED_DARK: "solarized-dark.yml",
  TOKYONIGHT: "tokyonight.yml",
  WHITE: "white.yml",
};

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
