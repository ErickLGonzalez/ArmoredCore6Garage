/**
 * Static UI art for the React garage (slot silhouettes, sort glyphs, etc.).
 * Files live in `garage-ui-assets/` at the repo root and are mirrored to
 * `public/garage-ui/` so Next serves them at `/garage-ui/…`.
 */
export const GARAGE_UI_ASSET_BASE = "/garage-ui";

export function garageUiAsset(file: string): string {
  const clean = file.replace(/^\/+/, "");
  return `${GARAGE_UI_ASSET_BASE}/${clean}`;
}
