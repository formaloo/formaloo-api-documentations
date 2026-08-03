Creates a single-select choice field, usually rendered as radio options. Use this when respondents must pick exactly one option from a defined list.

Choices can be supplied in either of two ways:

- `choice_items`: explicit choice objects, for example `{ "title": "Enterprise" }`.
- `bulk_choices`: a list of labels or a newline-separated string.

Do not send `choice_items` and `bulk_choices` in the same request. For updates, include existing choice `slug` values for choices that should remain.

## Example request

```json
{
  "form": "kTX4WMpC",
  "title": "How was your experience?",
  "description": "Select one option.",
  "required": true,
  "choice_items": [
    { "title": "Excellent" },
    { "title": "Good" },
    { "title": "Fair" },
    { "title": "Poor" }
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
      "slug": "GFUOFRUTeg",
      "type": "choice",
      "title": "How was your experience?",
      "description": "Select one option.",
      "required": true,
      "choice_items": [
        { "slug": "choice_hqcOEipwGU", "title": "Excellent" },
        { "slug": "choice_0woGVsPoIc", "title": "Good" },
        { "slug": "choice_a1b2c3d4", "title": "Fair" },
        { "slug": "choice_e5f6g7h8", "title": "Poor" }
      ],
      "position": 0
    }
  }
}
```

## Example request: quiz/scoring choice field

```json
{
  "form": "kTX4WMpC",
  "title": "What is the right choice?",
  "required": true,
  "is_calculatable": true,
  "answer_description": "Charlie is the right answer.",
  "choice_items": [
    { "title": "Alpha" },
    { "title": "Beta" },
    { "title": "Charlie" },
    { "title": "Delta" }
  ]
}
```

After create, retrieve choice slugs and patch `calculation_items` to assign points per choice. Then enable form-level score display with `PATCH /v3.0/forms/{slug}/`.
