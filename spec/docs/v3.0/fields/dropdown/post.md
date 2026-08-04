Creates a dropdown single-select field. Use this when the option list is long or the UI should remain compact while still allowing only one selected answer.

Choices can be supplied in either of two ways:

- `choice_items`: explicit choice objects, for example `{ "title": "Enterprise" }`.
- `bulk_choices`: a list of labels or a newline-separated string.

Do not send `choice_items` and `bulk_choices` in the same request. For updates, include existing choice `slug` values for choices that should remain.

## Example request

```json
{
  "form": "kTX4WMpC",
  "title": "Education level",
  "description": "Select the highest level completed.",
  "required": false,
  "choice_items": [
    { "title": "High school" },
    { "title": "Bachelor's" },
    { "title": "Master's" },
    { "title": "Doctorate" }
  ]
}
```

## Example response (`201`)

```json
{
  "status": 201,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "field": {
      "slug": "i7OXMLqRh0",
      "type": "dropdown",
      "title": "Education level",
      "description": "Select the highest level completed.",
      "required": false,
      "choice_items": [
        { "slug": "choice_SlLBeJ7uI5", "title": "High school" },
        { "slug": "choice_sO31Vvt3xq", "title": "Bachelor's" },
        { "slug": "choice_m9n8o7p6", "title": "Master's" },
        { "slug": "choice_q5r4s3t2", "title": "Doctorate" }
      ],
      "position": 0
    }
  }
}
```

You can also create dropdown fields through `POST /v3.0/fields/` with `"type": "dropdown"`.
