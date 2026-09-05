Starts a 15-minute sample-capture window for an inactive incoming webhook and clears its previous sample.

Send a representative JSON payload to the webhook's public receive URL during this window using its configured Bearer token or API-key header. Formaloo stores the payload and publishes it to the correlated Signals session without creating or updating a row.

Active webhooks must be deactivated before starting another capture.
