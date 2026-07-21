## Update Anonymization Config (Partial)

Partially updates a form's automatic data anonymization config, looked up by form
slug. Use this to change the retention window, adjust the anonymized field list,
or toggle the policy on/off without sending the whole object.

### Path parameter

| Parameter | Description |
| --- | --- |
| `form_slug` | Slug of the form whose anonymization config is updated. |

### Editable fields

| Field | Description |
| --- | --- |
| `retention_days` | New retention window. Integer in the range `1..3650`. |
| `field_slugs` | Replacement list of field slugs to anonymize. Each slug must belong to the form; duplicates are removed. |
| `enabled` | Enable or disable anonymization. |

The `form` binding is immutable on update and cannot be reassigned. `enabled_at`,
`created_at`, and `updated_at` are read-only.

### Behavior and rules

- **Entitlement:** enabling (or keeping the config enabled) requires the
  enterprise privacy add-on. The first successful enable stamps `enabled_at`.
- **Disabling:** the form drops out of the anonymization scan. Rows still pending
  are never anonymized while disabled, and rows already anonymized stay
  anonymized (anonymization is irreversible).
- **Changing `retention_days`:** applies to all non-anonymized submitted rows
  using the live value. Increasing it defers rows that were about to be
  anonymized; decreasing it can make older rows immediately eligible.
- **Changing `field_slugs`:** affects rows anonymized after the change. Fields
  already anonymized on prior rows are not restored.

### When to use it

- Pausing/resuming anonymization for a form.
- Tuning the retention window or the set of anonymized fields.

### Related

- `PUT` on the same path for a full replacement of the config.
