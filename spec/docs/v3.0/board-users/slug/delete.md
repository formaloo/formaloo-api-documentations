Removes a direct board-share record by slug. Use this when revoking a collaborator's explicit access to a board and cleaning up access that was created through board sharing.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
