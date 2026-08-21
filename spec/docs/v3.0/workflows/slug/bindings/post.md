Creates a binding that maps a blueprint `node_key` to a built Formaloo `artifact_slug`.

Use this after creating/adopting an artifact so later plan iterations can update the same resource. Bindings are what make plan → actual durable across sessions.

## Path params

- `slug`: workflow slug

## Request fields

- `node_key` (required): plan-local node key from the blueprint
- `node_type` (required): matching node type (`form`, `email_template`, …)
- `artifact_slug` (required): slug of the built Formaloo artifact
- `status` (optional): `pending` | `built` | `failed` (default `pending`)
- `error` (optional): JSON object with actionable failure details when `failed`

`node_key` must be unique within the workflow (`400` if duplicated).

## Example request

```json
{
  "node_key": "quiz",
  "node_type": "form",
  "artifact_slug": "kTX4WMpC",
  "status": "built"
}
```

## Example response (`201`)

```json
{
  "status": 201,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "workflow_binding": {
      "slug": "bind001A",
      "node_key": "quiz",
      "node_type": "form",
      "artifact_slug": "kTX4WMpC",
      "status": "built"
    }
  }
}
```

Recommended pattern: build form/email/PDF via their endpoints, then immediately create bindings for every blueprint node that was created or adopted.
