Deletes a generated PDF record for a row. Use this when removing an outdated or unwanted generated document from a submission.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
