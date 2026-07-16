Replaces form metadata and field definitions together. Use this for full form-builder saves where field order, field settings, and form settings should be updated as one operation.

## Payload shape

```json
{
  "form": {
    "title": "Customer feedback"
  },
  "fields": [
    {
      "ref_id": "name",
      "type": "short_text",
      "title": "Name"
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

- Retrieve the current form builder data first and preserve fields/settings that should not change.
- Include `slug` to update or preserve an existing field.
- Omit `slug` and include `type` to create a new field.
- Use `ref_id` as a temporary client-side identifier. The response echoes it beside the generated field `slug`.
- Field order follows the order of the `fields` array.
- For dependent fields, such as lookup/profile-data fields, a request can reference an earlier field by its `ref_id`; the backend maps it to the generated slug.
- The response reports each field with `status`, `errors`, and `object`. Check these before assuming all field changes succeeded.
