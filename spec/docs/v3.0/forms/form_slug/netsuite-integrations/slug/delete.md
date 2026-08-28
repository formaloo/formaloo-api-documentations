Deletes the form-level NetSuite mapping. This does not uninstall the catalog app or remove the user's NetSuite credentials.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
