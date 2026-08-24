# Apply themes to older forms

`POST /v3.0/forms/theme-cleanup/apply/`

Queues a workspace-wide job that assigns one theme to every unthemed Classic
form and another theme to every unthemed one-question-at-a-time form. Existing
themed forms are never changed.

Send a theme slug for each form type that currently has unthemed forms. A
selection is not required for a form type whose count is zero. Each selected
theme must be a system theme or belong to the active workspace, and its
`form_type` must match the target section.

```json
{
  "simple_theme": "brand-classic",
  "multi_step_theme": "brand-1qat"
}
```

The operation is asynchronous and all-or-nothing per form type; it does not
support selecting individual forms. Poll `GET /v3.0/forms/theme-cleanup/`
until the returned batch reaches `completed` or `failed`.

Assignment is race-safe and only writes forms that still have no theme. If
another admin themes a form while the job is running, that form is skipped.
Published forms begin using the selected theme as their batch chunk completes.
Legacy per-form appearance settings remain stored so the operation can be
undone.

Only one apply or undo operation can run for a workspace at a time. A
concurrent request is rejected with `409`.

## Example accepted response

```json
{
  "status": 201,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "theme_cleanup": {
      "slug": "T7f3Qp2L",
      "status": "pending",
      "simple_theme": "brand-classic",
      "multi_step_theme": "brand-1qat",
      "simple_total_count": 1000,
      "multi_step_total_count": 250,
      "total_count": 1250,
      "processed_count": 0,
      "applied_count": 0,
      "failed_count": 0,
      "failed_form_slugs": [],
      "progress_percent": 0,
      "undo_available": false
    }
  }
}
```

Partial failures do not roll back successful assignments. Inspect
`failed_form_slugs` after completion; forms that remain unthemed can be
retried with another apply request.
