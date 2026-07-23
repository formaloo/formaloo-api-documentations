Creates a reusable v5 form theme for the business. Use this when saving custom styling that can be applied across forms.

After creating a theme, assign it to a form by patching the form with the created theme `slug`:

```json
{
  "theme": "theme-slug"
}
```

## Theme payload structure

Current v5 themes use top-level visual fields plus a nested `theme_config` object.

Common top-level fields:

- `title`: display name for the reusable theme.
- `form_type`: form presentation type. Common values are `simple`, `multi_step`, and `nps`.
- `text_color`, `button_color`, `theme_color`, `field_color`, `background_color`, `border_color`, `submit_text_color`: color fields encoded as JSON-stringified RGBA values, for example `"{\"r\":31,\"g\":45,\"b\":61,\"a\":1}"`.
- `logo_position`: common values are `left`, `center`, `right`, or `null`.
- `show_title`: whether the form title is visible.
- `theme_config`: additional v5 theme configuration.

Common `theme_config` keys:

- `form_layout`: common values are `top`, `center`, `left`, `right`, `left-full`, and `right-full`.
- `modern_view`
- `google_font`
- `font_size`: supported values are `small` and `large`.
- `background_image`
- `background_type`
- `background_shadow`
- `widget_settings`
- `customized_texts`
- `display_welcome_page`
- `field_background_color`
- `progress_percentage`
- `form_width`: numeric width control.
- `fullwidth_theme`
- `theme_background_pattern`

Preserve unknown `theme_config` keys when copying or partially updating an existing theme. The theme renderer may support keys that are not represented in this documentation.
