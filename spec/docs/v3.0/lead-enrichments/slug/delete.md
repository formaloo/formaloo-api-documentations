Deletes a lead-enrichment configuration by slug. This stops that configuration from enriching future matching submissions; it does not remove form fields or previously enriched data.

Deleting the configuration also removes its managed form webhook.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
