Restores a workflow to a previous version sequence.

Use this when rolling back blueprint or workflow field changes after a bad iteration. Prefer listing versions first to choose the correct `sequence`.

## Path params

- `slug`: workflow slug
- `sequence`: integer version sequence to restore to

## Request body (optional)

```json
{
  "note": "Rollback after invalid blueprint patch"
}
```

## Behavior

- Uses Formaloo `RestoreService` for the workflow version root.
- Appends a new `restore` version after a successful apply.
- Returns the restored workflow payload (`200`).
- Fails with `400` when the sequence cannot be restored (missing sequence, already head, precondition failures, etc.).

## Example response (`200`)

```json
{
  "status": 200,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "workflow": {
      "slug": "aBc123Xy",
      "title": "Quiz v1",
      "status": "draft",
      "blueprint": { "...": "restored blueprint..." }
    }
  }
}
```

Restore changes the Workflow container fields/blueprint only. It does not restore bindings or roll back forms, apps, logic, notifications, or triggers. After restore, reconcile bindings with the restored node keys, inspect live artifacts, and regenerate the graph.
