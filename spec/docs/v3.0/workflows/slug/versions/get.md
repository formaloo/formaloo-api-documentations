Lists version history for a workflow.

Use this when reviewing prior blueprint or `context` revisions before restore, or when an MCP client needs to show what changed across plan iterations.

## Path params

- `slug`: workflow slug

## Notes

- Versions are append-only audit rows (`sequence`, `action`, `changes`, actor metadata).
- Capture depends on workspace versioning eligibility. The **current** blueprint and `context` on `GET /workflows/{slug}/` are always available regardless. Context changes are stored on the same version rows as the other workflow fields.
- Sort typically newest-first by `sequence`.

## Example response (`200`)

```json
{
  "status": 200,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "workflow_versions": [
      {
        "sequence": 2,
        "action": "update",
        "actor_type": "mcp",
        "source": "api",
        "changes": {
          "self": {
            "title": {
              "old_value": "Quiz v1",
              "new_value": "Quiz v2"
            }
          },
          "children": []
        },
        "created_at": "2026-08-21T18:00:00Z"
      }
    ]
  }
}
```

Restore with `POST /workflows/{slug}/versions/{sequence}/restore/`.
