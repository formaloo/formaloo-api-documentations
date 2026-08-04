Creates a rating field. Use this for satisfaction scores, review scales, NPS questions, sliders, or thumbs up/down feedback.

Supported `sub_type` values:

| Rating variant | `sub_type` | Notes |
| --- | --- | --- |
| Star Rating / CSAT | `embeded` | Dashboard-compatible value. The spelling is legacy API spelling. |
| Like/Dislike | `like_dislike` | Thumbs up/down style rating. |
| NPS | `nps` | Usually used with `range_start: 0` and `range_end: 10`. |
| Slider | `score` | Slider-style score input. |

Some older/generated contracts may mention `star`; treat it as a legacy alias and use `embeded` for new dashboard-editable Star Rating / CSAT fields.

## Example request: Star Rating / CSAT

```json
{
  "form": "customer-feedback",
  "title": "How satisfied are you?",
  "sub_type": "embeded",
  "range_start": 1,
  "range_end": 5
}
```

## Example request: NPS

```json
{
  "form": "customer-feedback",
  "title": "How likely are you to recommend us?",
  "sub_type": "nps",
  "range_start": 0,
  "range_end": 10
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
      "slug": "mQ3hMjoC",
      "type": "rating",
      "title": "How likely are you to recommend us?",
      "sub_type": "nps",
      "has_custom_range": true,
      "range_start": 0,
      "range_end": 10,
      "required": false,
      "position": 0
    }
  }
}
```

Not every rating subtype accepts custom ranges. Sending unsupported `range_start` / `range_end` values returns `400`.