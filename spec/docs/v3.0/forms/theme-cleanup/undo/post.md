# Undo a theme cleanup batch

`POST /v3.0/forms/theme-cleanup/undo/`

Queues restoration of the exact forms changed by a completed Theme Cleanup
batch. Undo is available for 14 days after theme assignment finishes.

```json
{
  "batch": "T7f3Qp2L"
}
```

The operation removes the assigned theme from each recorded form, causing its
preserved legacy appearance settings to render again. It only changes a form
when that form still uses the theme assigned by the batch. A form that an
admin re-themed after cleanup is left untouched.

Undo runs asynchronously. Poll `GET /v3.0/forms/theme-cleanup/` until the
batch reaches `undone` or `undo_failed`. While undo is running, another apply
or undo request for the workspace is rejected with `409`.

## Example accepted response

```json
{
  "status": 202,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "theme_cleanup": {
      "slug": "T7f3Qp2L",
      "status": "undoing",
      "simple_theme": "brand-classic",
      "multi_step_theme": "brand-1qat",
      "total_count": 1250,
      "processed_count": 0,
      "applied_count": 1250,
      "failed_count": 0,
      "failed_form_slugs": [],
      "progress_percent": 0,
      "undo_available": false,
      "undo_expires_at": "2026-09-07T18:00:00Z"
    }
  }
}
```

After successful undo, the unthemed-form count increases again and the
workspace cleanup notice can be shown. An expired batch or a batch that has
not completed cannot be undone.
