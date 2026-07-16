Replaces editable form-theme data. Use this when saving a complete theme edit.

Use `PUT` only when replacing the editable theme payload. For smaller edits, prefer `PATCH`.

Current v5 themes use top-level visual fields plus a nested `theme_config` object. Color fields such as `text_color`, `button_color`, `theme_color`, `field_color`, `background_color`, `border_color`, `submit_text_color`, and `theme_config.field_background_color` use JSON-stringified RGBA values, for example `"{\"r\":31,\"g\":45,\"b\":61,\"a\":1}"`.

When replacing an existing theme, retrieve it first and preserve unknown `theme_config` keys unless intentionally resetting the theme.
