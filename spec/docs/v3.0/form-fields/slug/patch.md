Partially updates form metadata and field definitions together. Use this for incremental form-builder saves involving one or more fields and related form settings.

This is the preferred endpoint for agent-driven form building when several field changes should be saved together.

## Payload shape

```json
{
  "form": {
    "title": "Customer feedback"
  },
  "fields": [
    {
      "ref_id": "existing_name",
      "slug": "short_text_abc123"
    },
    {
      "ref_id": "satisfaction",
      "type": "choice",
      "title": "How satisfied are you?",
      "choice_items": [
        { "ref_id": "happy", "title": "Happy" },
        { "ref_id": "needs_help", "title": "Needs help" }
      ]
    }
  ]
}
```

Rules:

- Retrieve the current form builder data first.
- Include existing fields that should remain in the form field order.
- Include `slug` to update or preserve an existing field.
- Omit `slug` and include `type` to create a new field.
- Use `ref_id` as a temporary client-side identifier for ordering and response mapping.
- For lookup/profile-data fields, same-request references can point to an earlier field by `ref_id`.
- The backend preserves the default success page field automatically.
- The response reports each field with `status`, `errors`, and `object`; handle partial failures per field.

## Data anonymization config

`anonymization_config` is a top-level key (a sibling of `form` and `fields`), so the anonymization policy can be updated on its own without sending any `form` or `fields` data.

```json
{
  "anonymization_config": {
    "enabled": true,
    "retention_days": 30,
    "field_slugs": ["short_text_abc123", "email_def456"]
  }
}
```

Fields:

- `enabled` (boolean): whether automatic anonymization runs for this form.
- `retention_days` (int, 1..3650): age after which a submission's data is anonymized.
- `field_slugs` (list of strings): field slugs whose values get nulled; must belong to this form.

Rules:

- Requires the business to have the automatic data anonymization add-on; otherwise the request is rejected.
- If the form has no config yet, one is created. `retention_days` is required in this case.
- If a config already exists, it is updated; omitted fields keep their current values.
- Unknown `field_slugs` (not belonging to the form) are rejected.
- Sending `anonymization_config` alone leaves the form and fields untouched.
