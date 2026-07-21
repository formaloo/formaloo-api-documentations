## Create Anonymization Config

Creates the automatic data anonymization policy for a single form. A form can
have exactly one config, so this endpoint is used once per form to define its
retention window and the fields whose values should be permanently nulled after
that window elapses.

### What it does

- Attaches a new anonymization config to the form referenced by `form` (slug).
- Stores `retention_days` and the `field_slugs` to anonymize.
- When created with `enabled = true`, stamps `enabled_at` with the current time
  and brings the form into the hourly anonymization scan.

### Fields

| Field | Required | Description |
| --- | --- | --- |
| `form` | Yes | Slug of the form to attach the config to. Must belong to the current business and be accessible to the user. |
| `retention_days` | Yes | Days to retain a submitted row before it becomes eligible for anonymization. Integer in the range `1..3650`. |
| `field_slugs` | Yes | List of field slugs to anonymize. May be empty, but each slug must belong to the form. Duplicates are removed. |
| `enabled` | No | Whether anonymization is active. Defaults to `false`. |
| `enabled_at` | Read-only | Set automatically the first time the config becomes enabled. |

### Behavior and rules

- **Entitlement:** enabling requires the enterprise privacy add-on
  (automatic data anonymization). Creating with `enabled = true` without the
  add-on is rejected. A disabled config can be created without the add-on.
- **One per form:** attempting to create a second config for a form is rejected.
- **Field validation:** every slug in `field_slugs` must exist on the form;
  unknown slugs are rejected.
- **Retention clock:** eligibility is measured from each row's `created_at`; row
  edits do not reset the countdown.

### When to use it

- First-time setup of a form's data-retention/anonymization policy.
- Onboarding a form into automated PII cleanup after a fixed retention period.

### Related

- Update the policy later with `PATCH` or `PUT` on
  `anonymization-configs/{form_slug}/`.
