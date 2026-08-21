Retrieves one workflow binding by its binding slug.

Use this when checking build status, artifact slug, or error details for a single node mapping.

## Path params

- `slug`: workflow slug
- `binding_slug`: binding slug (not the node key)

## Example response (`200`)

```json
{
  "status": 200,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "workflow_binding": {
      "slug": "bind001A",
      "node_key": "quiz",
      "node_type": "form",
      "artifact_slug": "kTX4WMpC",
      "status": "built",
      "error": {}
    }
  }
}
```

To find a binding by `node_key`, list bindings and filter client-side, or keep the binding slug returned at create time.
