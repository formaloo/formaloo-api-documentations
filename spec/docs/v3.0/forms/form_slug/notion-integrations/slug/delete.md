Deletes the form-level Notion mapping. This does not uninstall the catalog app, disconnect the Notion workspace, or delete the Notion database.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
