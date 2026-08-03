# Unpin a board

You can unpin a board by calling this endpoint with the board's slug. The board should be already pinned, otherwise you will get a 404 error.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
