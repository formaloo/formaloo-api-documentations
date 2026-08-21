Partially updates a workflow binding.

Use this when recording a rebuilt artifact slug, changing status (`pending` | `built` | `failed`), or storing build error details after a failed create/adopt.

## Path params

- `slug`: workflow slug
- `binding_slug`: binding slug

## Example request

```json
{
  "artifact_slug": "newForm99",
  "status": "built",
  "error": {}
}
```

## Example response (`200`)

```json
{
  "status": 200,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "workflow_binding": {
      "slug": "bind001A",
      "node_key": "quiz",
      "artifact_slug": "newForm99",
      "status": "built"
    }
  }
}
```

Changing `node_key` to a key that already has another binding returns `400`.
