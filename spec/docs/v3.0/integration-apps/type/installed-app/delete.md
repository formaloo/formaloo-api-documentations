Uninstalls the requested integration app for the authenticated profile.

Uninstalling removes the catalog installation record. Do not assume it revokes credentials at the external provider or removes every provider-specific configuration; inspect those resources separately when performing a full disconnect.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
