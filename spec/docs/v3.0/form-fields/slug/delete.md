Deletes the form associated with the builder endpoint. Use this only when removing the entire form, not when deleting a single field.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
