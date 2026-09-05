Receives a JSON payload from an external system.

This endpoint does not use Formaloo dashboard authentication headers. Authenticate with the scheme configured for the webhook:

```http
Authorization: Bearer <webhook-secret>
```

or send the secret in the configured custom API-key header.

When the webhook is inactive with a valid capture window, the payload is captured and published to Signals without changing rows. When active, Formaloo resolves the configured JSON Pointers and performs the selected action:

- `create` always creates a row.
- `update` updates the row identified by top-level `row_slug` or the configured unique identifier and returns an error when no row matches.
- `update_or_create` updates by the configured unique identifier or creates a row when none matches.

Example payload:

```json
{
  "contact": {
    "name": "Ada Lovelace",
    "email": "ada@example.com"
  }
}
```

For an update by row slug, include it at the top level:

```json
{
  "row_slug": "existing-row-slug",
  "contact": {
    "name": "Updated name"
  }
}
```

Missing mapped source values reject the request; Formaloo does not partially apply the mapping.
