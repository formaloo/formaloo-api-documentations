Revokes a form-share record by slug. Use this when removing a collaborator's explicit access to a form.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
