Partially updates a form theme. Use this when changing selected theme properties such as title, colors, typography, spacing, or component styling.

Before patching a theme, retrieve the current theme and preserve existing values that are not intentionally changing. This is especially important for `theme_config`, because the theme renderer may support keys that are not represented in this documentation.

Color fields such as `text_color`, `button_color`, `theme_color`, `field_color`, `background_color`, `border_color`, `submit_text_color`, and `theme_config.field_background_color` use JSON-stringified RGBA values, for example:

```json
{
  "button_color": "{\"r\":34,\"g\":197,\"b\":94,\"a\":1}",
  "submit_text_color": "{\"r\":255,\"g\":255,\"b\":255,\"a\":1}"
}
```

For targeted edits, send only the fields you intend to change. If sending `theme_config`, include the existing keys you want to preserve.
