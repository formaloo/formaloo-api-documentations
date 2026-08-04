Deletes a form webhook. Use this when disconnecting an external receiver from form events.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
