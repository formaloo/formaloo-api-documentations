Deletes a field from its form. Use this when removing a question or layout element from the form while also clearing related field configuration.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
