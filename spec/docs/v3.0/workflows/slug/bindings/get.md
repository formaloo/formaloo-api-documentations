Lists artifact bindings for a workflow.

Use this when an MCP client needs to see which blueprint `node_key` values are already mapped to built Formaloo resources, so later iterations update the same artifacts instead of creating duplicates.

## Path params

- `slug`: workflow slug

## Common query params

- `status`: `pending` | `built` | `failed`
- `node_type`: e.g. `form`, `email_template`, `pdf_template`
- `sort_by`: e.g. `node_key`, `created_at`

## Example response (`200`)

```json
{
  "status": 200,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "workflow_bindings": [
      {
        "slug": "bind001A",
        "node_key": "quiz",
        "node_type": "form",
        "artifact_slug": "kTX4WMpC",
        "status": "built"
      }
    ]
  }
}
```

`artifact_slug` is the Formaloo resource slug (form, email template, PDF template, etc.) created or adopted during build.
