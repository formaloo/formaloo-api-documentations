Retrieves a form's full admin configuration. Use this when opening a form for editing or inspecting current settings, access, theme, and behavior.

## Theme model

Current v5 form styling is managed through reusable theme resources:

- The form response includes `theme` as the assigned theme object, or `null` when no reusable theme is assigned.
- Use `/v3.0/themes/` to list or create reusable themes.
- Use `PATCH /v3.0/forms/{slug}/` with `{ "theme": "theme_slug" }` to assign a theme to a form.
- Older form-level styling fields such as `theme_config`, `button_color`, `text_color`, and image slug fields may still appear for compatibility/fallback rendering. Prefer theme resources for new theme workflows.

## Example response (`200`)

```json
{
  "status": 200,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "form": {
      "slug": "cv7kTWdv",
      "address": "vxag2",
      "title": "Customer Feedback",
      "show_title": true,
      "description": "Tell us how we can improve.",
      "success_message": "Thanks for your feedback.",
      "button_text": "Submit",
      "form_type": "simple",
      "active": true,
      "theme": null,
      "fields_list": [
        {
          "slug": "cua2HD7TRT",
          "type": "choice",
          "title": "What is the right choice?",
          "required": false,
          "is_calculatable": true,
          "answer_description": "Charlie is the right answer.",
          "choice_items": [
            { "slug": "choice_2x3stCkoyZ", "title": "Alpha" },
            { "slug": "choice_Vxi0bZaodE", "title": "Beta" },
            { "slug": "choice_xceKPe8TjI", "title": "Charlie" },
            { "slug": "choice_fykmSbNsur", "title": "Delta" }
          ]
        }
      ],
      "submit_count": 0,
      "total_submits_count": 0
    }
  }
}
```

Use the returned field and choice slugs when building `logic`, calculation items, or theme assignment payloads.
