## List Anonymization Configs

Returns every automatic data anonymization config that belongs to forms in the
current business. Use this endpoint to build an overview of which forms have a
data-retention/anonymization policy and how each one is configured.

### What it does

- Scopes results to the authenticated business (`form__business == request.business`).
- Returns one config per form (the relationship is one-to-one).
- Orders results by newest first (`-created_at`).

### When to use it

- Rendering a privacy/retention dashboard across a business's forms.
- Auditing which forms have anonymization enabled and their retention windows.
- Discovering the `form` slugs needed for the per-form retrieve/update endpoints.

### Notes

- Only forms that have explicitly had a config created appear here. Forms that
  never configured anonymization return no row.
- Each config exposes `enabled`, `retention_days`, `field_slugs`, and
  `enabled_at` so a client can show the full policy without extra calls.
- A config may exist with `enabled = false`; presence in the list does not imply
  anonymization is currently running.
