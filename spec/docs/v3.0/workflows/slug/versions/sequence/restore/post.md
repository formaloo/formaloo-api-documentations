Restores a workflow to a previous version sequence.

Use this when rolling back blueprint, `context`, or other workflow field changes after a bad iteration. Prefer listing versions first to choose the correct `sequence`. Restore returns the `context` saved with that version.

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

Restore changes the Workflow container fields, including blueprint and `context`. It rewrites `is_starting_point` on existing bindings from the restored nodes. It does not restore artifact slugs or binding status, and it does not roll back forms, apps, logic, notifications, or triggers. After restore, add or remove bindings when the restored node keys differ, inspect live artifacts, and regenerate the graph.
