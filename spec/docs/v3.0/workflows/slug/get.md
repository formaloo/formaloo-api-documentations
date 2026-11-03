Retrieves one saved Workflow solution container by slug, including its process blueprint, goal, context, and status. Bindings identify the forms, apps, and other artifacts implementing the solution; fetch them separately and inspect relevant live resources before continuation.

Use this when an MCP client needs the full plan before editing, validating, generating a graph, managing bindings, or restoring a prior version. Prefer this over list when you already know the slug.

## Path params

- `slug`: workflow slug

## Example response (`200`)

```json
{
  "status": 200,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "workflow": {
      "slug": "aBc123Xy",
      "title": "Scored quiz with pass email",
      "status": "planning",
      "goal": "A quiz that scores answers and emails high scorers.",
      "blueprint": {
        "schema_version": "1.0",
        "goal": "A quiz that scores answers and emails high scorers.",
        "nodes": []
      }
    }
  }
}
```

## Next steps

- Review graph: `GET /workflows/{slug}/graph/`
- Dry-run a revised plan: `POST /workflows/{slug}/validate/`
- Apply changes: `PATCH /workflows/{slug}/`
- Inspect built artifact mappings: `GET /workflows/{slug}/bindings/`
- Review history: `GET /workflows/{slug}/versions/`
