# Data

| Path                | Purpose                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `source/parts.json` | Raw AC6 parts export (same shape as legacy `PartsData.json`). Replace when upstream data changes. |
| `parts.merged.json` | Generated, Zod-validated canonical dataset for MasterofArena (run `npm run data:merge`).          |

Do not edit `parts.merged.json` by hand; regenerate from source.
