# Spreadsheet overrides (M2 extension)

Export your Google Sheet to **CSV** (or build a JSON array) and merge stat overrides into `data/parts.merged.json` without hand-editing the large file.

## CSV format

```text
partName,field,value
RF-024 TURNER,AttackPower,1400
```

- **partName** — must match `identity.name` in the merged dataset (same string as in-game / `PartsData.json`).
- **field** — PascalCase key written into `baseStats` (e.g. `AttackPower`, `Weight`).
- **value** — number, `true` / `false`, or string.

Commas inside values are not supported by the simple parser; use JSON merge for complex cells.

## Commands

```bash
npm run data:merge
npx tsx scripts/merge-spreadsheet.ts --input data/source/overrides.csv
```

JSON input must be an array of `{ "partName", "field", "value" }` objects.

Invalid overrides are skipped with a console warning; the schema must still validate after each change.
