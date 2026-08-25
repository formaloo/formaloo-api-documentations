Lists workflows for the active business. Use this when an MCP client needs to discover existing plans, resume iteration on a prior plan, or pick a workflow by title/status before validate, graph, bindings, or restore.

## Common query params

- `search`: match title or goal text
- `status`: filter by lifecycle (`planning`, `draft`, `testing`, `live`, `archived`)
- `sort_by`: e.g. `created_at`, `updated_at`, `title`
- `page`, `page_size`, `pagination=0` to disable pagination

## Example response (`200`)

```json
{
  "status": 200,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "count": 1,
    "next": null,
    "previous": null,
    "workflows": [
      {
        "slug": "aBc123Xy",
        "title": "Scored quiz with pass email",
        "status": "planning",
        "goal": "Quiz that scores answers and emails high scorers."
      }
    ]
  }
}
```

Use returned `slug` values with detail, validate, graph, bindings, and versions endpoints.
