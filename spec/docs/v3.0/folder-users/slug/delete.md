Revokes a folder-share record by slug. Use this when removing a user's folder-level access without necessarily changing direct board shares elsewhere.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
