/**
 * Normalize display / lookup names (trim, collapse whitespace, Unicode normalize).
 * Alias map can be extended when spreadsheet keys diverge from in-game strings.
 */
const ALIASES: Record<string, string> = {};

export function normalizePartName(raw: string): string {
  const trimmed = raw.trim().normalize("NFKC");
  const collapsed = trimmed.replace(/\s+/g, " ");
  return ALIASES[collapsed] ?? collapsed;
}
