Deletes the form-level Mailchimp mapping. This does not uninstall the catalog app, revoke Mailchimp authorization, or delete the Mailchimp audience.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
