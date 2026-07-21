## Replace Anonymization Config

Replaces a form's automatic data anonymization config, looked up by form slug.
Use this when saving a complete, authoritative version of the policy rather than
adjusting individual fields.

### Path parameter

| Parameter | Description |
| --- | --- |
| `form_slug` | Slug of the form whose anonymization config is replaced. |

### Fields

| Field | Required | Description |
| --- | --- | --- |
| `retention_days` | Yes | Retention window for submitted rows. Integer in the range `1..3650`. |
| `field_slugs` | Yes | Full list of field slugs to anonymize. May be empty; each slug must belong to the form. Duplicates are removed. |
| `enabled` | No | Whether anonymization is active. Defaults to `false` when omitted. |

The `form` binding is immutable and cannot be reassigned. `enabled_at`,
`created_at`, and `updated_at` are read-only.

### Behavior and rules

- **Entitlement:** enabling requires the enterprise privacy add-on. The first
  successful enable stamps `enabled_at`.
- **Retention semantics:** the new `retention_days` applies to all non-anonymized
  submitted rows using the live value; eligibility is measured from each row's
  `created_at`.
- **Irreversibility:** disabling stops future anonymization but does not restore
  previously anonymized rows.
- **Field validation:** unknown field slugs are rejected.

### When to use it

- Applying a fully-formed policy change from a settings form that always submits
  the complete config.

### Related

- `PATCH` on the same path for partial updates.
