Partially updates a saved Workflow solution container owned by the active workspace. Revise its `context`, goal, blueprint, or descriptive status while maintaining the same solution identity.

Use this for a requested change to the saved solution. Updating its blueprint does not change the bound forms, apps, logic, notifications, or triggers; configure those through their own endpoints. Preserve unrelated nodes and stable keys. `blueprint` and `context` are each a full replacement, so read current state first and keep decision keys the user did not reverse. No expected-revision conflict check is exposed by this contract; coordinate concurrent writers.

## Path params

- `slug`: workflow slug

## Common patch fields

- `title`, `description`, `goal`
- `status`: `planning` | `draft` | `testing` | `live` | `archived`
- `blueprint`: full replacement of the plan JSON (same shape as create)
- `context`: full replacement of the handoff document (same shape and limits as create). Omit it to leave the stored document unchanged. `null` or `{}` clears it.

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
