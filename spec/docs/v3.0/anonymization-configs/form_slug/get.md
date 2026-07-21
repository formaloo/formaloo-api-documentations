## Retrieve Anonymization Config

Returns the automatic data anonymization config for a single form, looked up by
form slug. Use this to load a form's current retention window, the fields it
anonymizes, and whether the policy is active.

### Path parameter

| Parameter | Description |
| --- | --- |
| `form_slug` | Slug of the form whose anonymization config is requested. |

### What it returns

- `enabled` — whether anonymization is currently active for the form.
- `retention_days` — the retention window applied to submitted rows.
- `field_slugs` — the field slugs configured for anonymization.
- `enabled_at` — when the policy was first enabled (null if never enabled).
- `created_at` / `updated_at` — audit timestamps.

### When to use it

- Pre-filling a privacy/retention settings screen for a form.
- Confirming the effective policy before editing it with `PATCH` or `PUT`.

### Notes

- Scoped to the current business; a form outside the business is not returned.
- Returns not-found when the form has no anonymization config, i.e. anonymization
  was never configured for it.
