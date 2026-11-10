Creates a binding connecting a Workflow solution node (`node_key`) to an existing Formaloo artifact (`artifact_slug`). Binding adopts or records the resource; it does not create, move, activate, or change access to it.

Use this after creating/adopting an artifact so later plan iterations can update the same resource. Bindings are what make plan → actual durable across sessions.

## Path params

- `slug`: workflow slug

## Request fields

- `node_key` (required): plan-local node key from the blueprint. This is not `artifact_slug`.
- `node_type` (required): matching node type (`form`, `email_template`, …)
- `artifact_slug` (required): slug of the built Formaloo artifact
- `is_starting_point` (required): must equal `is_starting_point` on the blueprint node with the same `node_key`
- `status` (optional): `pending` | `built` | `failed` (default `pending`)
- `error` (optional): JSON object with actionable failure details when `failed`

`node_key` must be unique within the workflow (`400` if duplicated). A mismatch on `is_starting_point` returns `400`. A node key that is absent from the blueprint cannot be saved with `is_starting_point` true. The stored flag is the blueprint node's flag.

## Example request

```json
{
  "node_key": "quiz",
  "node_type": "form",
  "artifact_slug": "kTX4WMpC",
  "is_starting_point": true,
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
      "is_starting_point": true,
      "status": "built"
    }
  }
}
```

Recommended pattern: build form/email/PDF via their endpoints, then immediately create bindings for every blueprint node that was created or adopted.
