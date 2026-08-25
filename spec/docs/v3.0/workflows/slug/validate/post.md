Dry-runs blueprint validation for an existing workflow **without saving**.

Use this when an MCP client wants hard confirmation that a proposed plan is schema-valid and referentially consistent before applying it with `PATCH /workflows/{slug}/`.

## Path params

- `slug`: workflow slug (must exist; used for workspace scoping / 404)

## Request body

```json
{
  "blueprint": {
    "schema_version": "1.0",
    "goal": "...",
    "nodes": []
  }
}
```

## What is checked

1. Schema shape (`BluePrintSerializer`)
2. Referential rules (`WorkflowValidator`), including:
   - unique node keys
   - every `to` resolves to a declared node
   - every `node_field` resolves to that node's `spec.inputs` / `spec.outputs`
   - mapping targets resolve to target-node inputs
   - `adopt` / `update` builds require `build.ref`
   - action allowed for source node type
   - test `expect` / `input` keys resolve

## Example response (`200`, valid)

```json
{
  "status": 200,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "validation": {
      "blueprint": { "...": "..." },
      "valid": true,
      "errors": []
    }
  }
}
```

## Example response (`200`, invalid)

```json
{
  "status": 200,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "validation": {
      "blueprint": { "...": "..." },
      "valid": false,
      "errors": [
        "Node `quiz` action[0]: target `missing_email` does not resolve to a declared node key."
      ]
    }
  }
}
```

Schema failures (wrong types/enums) may return `400` from serializer validation instead of `valid: false`.
