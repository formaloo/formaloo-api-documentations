Partially updates a workflow owned by the active business.

Use this when iterating on an existing plan after user review: change title/status, or replace `blueprint` with a revised plan. Prefer updating the same workflow rather than creating a duplicate.

## Path params

- `slug`: workflow slug

## Common patch fields

- `title`, `description`, `goal`
- `status`: `planning` | `draft` | `testing` | `live` | `archived`
- `blueprint`: full replacement of the plan JSON (same shape as create)

## Validation

If `blueprint` is sent, it is schema-validated and referentially validated the same way as create. Invalid node keys, missing `to` targets, unknown `node_field` aliases, or illegal actions for a node type return `400`.

For large or uncertain plans, dry-run first:

`POST /workflows/{slug}/validate/`

## Example request

```json
{
  "status": "draft",
  "blueprint": {
    "schema_version": "1.0",
    "goal": "Quiz that emails passers and generates a PDF certificate.",
    "nodes": []
  }
}
```

## Example response (`200`)

```json
{
  "status": 200,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "workflow": {
      "slug": "aBc123Xy",
      "status": "draft",
      "goal": "Quiz that emails passers and generates a PDF certificate."
    }
  }
}
```

After a successful blueprint update, refresh bindings if node keys changed, and re-check `GET /workflows/{slug}/graph/`.
