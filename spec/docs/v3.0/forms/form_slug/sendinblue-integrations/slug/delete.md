Deletes the form-level Brevo mapping. This does not uninstall the catalog app, revoke Brevo authorization, or delete the destination list.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
