Lists saved Workflow solution containers for the active workspace. Use this to find a process by title, goal, or status, resume a connected solution, or select it for blueprint, binding, graph, or history inspection. These are saved product artifacts, separate from optional MCP planning aids.

The list omits `context`. Retrieve the workflow to read the handoff.

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
