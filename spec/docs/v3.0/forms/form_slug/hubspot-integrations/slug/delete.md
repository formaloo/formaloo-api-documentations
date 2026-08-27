Deletes the form-level HubSpot mapping. This does not uninstall the HubSpot catalog app or revoke the user's HubSpot connection.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
