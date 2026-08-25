# Inspect workspace theme cleanup

`GET /v3.0/forms/theme-cleanup/`

Returns the current workspace's unthemed-form counts, live theme-preview
links, and latest cleanup-batch status. Use this endpoint to decide whether to
show the Theme Cleanup notice and to poll an apply or undo operation.

Only workspace owners and admins can access this workspace-wide operation.
Forms that already have a theme are never included. Counts are split between
Classic (`simple`) and one-question-at-a-time (`multi_step`) forms.

Theme preview links use the most recently updated active workspace form that
already uses the theme. When none exists, the API uses an active tagged
template form with that theme. A theme is omitted from `theme_previews` when no
live example is available; clients should show its thumbnail instead.

The latest batch can have one of these lifecycle states: `pending`, `running`,
`completed`, `failed`, `undoing`, `undone`, or `undo_failed`. Continue polling
while it is pending, running, or undoing. The response also indicates whether
undo is still available and when the undo window expires.

## Example response

```json
{
  "status": 200,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "theme_cleanup": {
      "unthemed_form_count": 1250,
      "form_type_counts": {
        "simple": 1000,
        "multi_step": 250
      },
      "theme_previews": {
        "brand-classic": "https://example.formaloo.me/customer-survey",
        "brand-1qat": "https://example.formaloo.me/feedback"
      },
      "batch": {
        "slug": "T7f3Qp2L",
        "status": "running",
        "simple_theme": "brand-classic",
        "multi_step_theme": "brand-1qat",
        "total_count": 1250,
        "processed_count": 500,
        "applied_count": 500,
        "failed_count": 0,
        "progress_percent": 40,
        "undo_available": false,
        "undo_expires_at": null
      }
    }
  }
}
```

When `unthemed_form_count` is zero, the workspace is fully migrated. The
frontend can hide the notice and show its completed empty state.
