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
- `form_type`: canonical form presentation type for the theme. Valid API values are `simple` and `multi_step`. Prefer `theme.form_type` over legacy form-level `form_type`.
- `text_color`, `button_color`, `theme_color`, `field_color`, `background_color`, `border_color`, `submit_text_color`: color fields encoded as JSON-stringified RGBA values, for example `"{\"r\":31,\"g\":45,\"b\":61,\"a\":1}"`.
- `logo_position`: common values are `left`, `center`, `right`, or `null`.
- `show_title`: whether the form title is visible.
- `theme_config`: additional v5 theme configuration.

Common `theme_config` keys:

- `form_layout`: common values are `top`, `center`, `left`, `right`, `left-full`, and `right-full`.
- `modern_view`
- `google_font`
- `font_size`: enum `small` | `medium` | `large` (base font-size preset; renderer default is `medium` when omitted).
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

## Example request

```json
{
  "title": "Technology Satisfaction Survey",
  "form_type": "simple",
  "text_color": "{\"r\":255,\"g\":255,\"b\":255,\"a\":1}",
  "button_color": "{\"r\":100,\"g\":149,\"b\":237,\"a\":1}",
  "field_color": "{\"r\":200,\"g\":200,\"b\":200,\"a\":1}",
  "background_color": "{\"r\":50,\"g\":50,\"b\":100,\"a\":1}",
  "border_color": "{\"r\":100,\"g\":149,\"b\":237,\"a\":1}",
  "submit_text_color": "{\"r\":255,\"g\":255,\"b\":255,\"a\":1}",
  "show_title": true,
  "theme_config": {
    "form_layout": "center",
    "modern_view": true,
    "background_image": {},
    "customized_texts": {
      "start_btn": "Let's Go!",
      "continue_btn": "Next Step"
    },
    "display_welcome_page": true,
    "field_background_color": "{\"r\":255,\"g\":255,\"b\":255,\"a\":0.2}"
  }
}
```

## Example response (`201`)

```json
{
  "status": 201,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "theme": {
      "slug": "G1ow5o0q",
      "title": "Technology Satisfaction Survey",
      "form_type": "simple",
      "show_title": true,
      "button_color": "{\"r\":100,\"g\":149,\"b\":237,\"a\":1}",
      "background_color": "{\"r\":50,\"g\":50,\"b\":100,\"a\":1}",
      "theme_config": {
        "form_layout": "center",
        "modern_view": true,
        "display_welcome_page": true
      }
    }
  }
}
```

Assign the returned theme slug to a form with `PATCH /v3.0/forms/{slug}/` and `{ "theme": "G1ow5o0q" }`.
