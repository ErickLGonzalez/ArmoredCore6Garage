# Theme Files

These YAML files define the classic UI theme tokens used by the app.

## How to add a new theme

1. Add a new `.yml` file in this folder.
2. Use the same keys as the existing theme files.
3. Register the new theme name and filename mapping in `lib/auth/themes.ts`.

## Required keys

- `ui_bg_top`
- `ui_bg_bottom`
- `ui_panel_top`
- `ui_panel_bottom`
- `ui_border`
- `ui_border_strong`
- `ui_text`
- `ui_text_dim`
- `ui_tab_top`
- `ui_tab_bottom`
- `ui_tab_active_top`
- `ui_tab_active_bottom`
- `ui_tab_active_text`

All values should be valid CSS colors (hex/rgb/rgba/hsl/etc).

## Optional keys

- `ui_accent_danger` (defaults to `#ef4444`)
- `ui_accent_compare` (defaults to `#f59e0b`)
- `ui_accent_positive` (defaults to `#86efac`)

These are used by warning/error and chart accent elements.
