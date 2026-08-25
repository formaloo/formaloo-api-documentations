Soft-deletes a workflow owned by the active business.

Use this when a plan should no longer appear in the workspace workflow list. Soft-deleted workflows are hidden from normal list/detail queries.

## Path params

- `slug`: workflow slug

## Behavior

Returns `200` with an empty `data` object on success. There is no separate confirmation step.

```json
{
  "status": 200,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {}
}
```

Deleting a workflow does not automatically delete Formaloo artifacts referenced by its bindings (forms, templates, etc.). Clean those up separately if needed.
