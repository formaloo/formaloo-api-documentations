Retrieves a form's full admin configuration. Use this when opening a form for editing or inspecting current settings, access, theme, and behavior.

## Theme model

Current v5 form styling is managed through reusable theme resources:

- The form response includes `theme` as the assigned theme object, or `null` when no reusable theme is assigned.
- Use `/v3.0/themes/` to list or create reusable themes.
- Use `PATCH /v3.0/forms/{slug}/` with `{ "theme": "theme_slug" }` to assign a theme to a form.
- Older form-level styling fields such as `theme_config`, `button_color`, `text_color`, and image slug fields may still appear for compatibility/fallback rendering. Prefer theme resources for new theme workflows.
