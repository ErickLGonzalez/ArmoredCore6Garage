import { DEFAULT_THEME, resolveTheme, type UiThemeName } from "@/lib/auth/themes";

export const DEV_FALLBACK_USERNAME = "EJRaven";
export const DEV_FALLBACK_PASSWORD = "1234";
export const DEV_FALLBACK_USER_ID = "dev-ejraven";

export function isDevFallbackEnabled() {
  return process.env.NODE_ENV !== "production";
}

export function isDevFallbackCredentials(username: string | undefined, password: string) {
  return (
    isDevFallbackEnabled() &&
    username === DEV_FALLBACK_USERNAME &&
    password === DEV_FALLBACK_PASSWORD
  );
}

export function makeDevToken(username: string) {
  return `dev:${username}`;
}

export function readDevUsername(token: string | null | undefined) {
  if (!token?.startsWith("dev:")) return null;
  const username = token.slice(4);
  return username || null;
}

export function makeDevUser(theme?: string) {
  const t: UiThemeName = resolveTheme(theme ?? DEFAULT_THEME);
  return {
    id: DEV_FALLBACK_USER_ID,
    username: DEV_FALLBACK_USERNAME,
    email: null,
    displayName: DEV_FALLBACK_USERNAME,
    theme: t,
  };
}
