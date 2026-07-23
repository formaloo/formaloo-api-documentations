Creates a rating field. Use this for satisfaction scores, review scales, NPS questions, sliders, or thumbs up/down feedback.

Supported `sub_type` values:

| Rating variant | `sub_type` | Notes |
| --- | --- | --- |
| Star Rating / CSAT | `embeded` | Dashboard-compatible value. The spelling is legacy API spelling. |
| Like/Dislike | `like_dislike` | Thumbs up/down style rating. |
| NPS | `nps` | Usually used with `range_start: 0` and `range_end: 10`. |
| Slider | `score` | Slider-style score input. |

Some older/generated contracts may mention `star`; treat it as a legacy alias and use `embeded` for new dashboard-editable Star Rating / CSAT fields.

Example Star Rating / CSAT field:

```json
{
  "form": "customer-feedback",
  "title": "How satisfied are you?",
  "sub_type": "embeded",
  "range_start": 1,
  "range_end": 5
}
```
