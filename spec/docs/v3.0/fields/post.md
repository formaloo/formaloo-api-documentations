Creates a form field using the `type` supplied in the request body. This is the recommended endpoint for agents, CLI clients, and form builders that programmatically add mixed field types through one URL.

Use the `type` field to choose the field kind, and use `sub_type` only for field families that have variants.

Common examples:

| Field | `type` | `sub_type` |
| --- | --- | --- |
| Short text | `short_text` | — |
| Long text | `long_text` | — |
| Single choice | `choice` | — |
| Dropdown | `dropdown` | — |
| Multiple choice | `multiple_select` | `standard` |
| Multiple choice dropdown | `multiple_select` | `dropdown` |
| Ranking | `multiple_select` | `ranking` |
| Star Rating / CSAT | `rating` | `embeded` |
| Like/Dislike | `rating` | `like_dislike` |
| NPS | `rating` | `nps` |
| Slider | `rating` | `score` |
| Page break | `meta` | `page_break` |
| Section/content | `meta` | `section` |
| Video content | `meta` | `video` |
| Variable | `variable` | `int`, `decimal`, `string`, or `formula` |

`embeded` is the legacy API spelling used for dashboard-compatible Star Rating / CSAT fields. Some generated contracts may also show `star`; prefer `embeded` for new fields that should edit cleanly in the dashboard.

For choice-like fields, provide choices with either `choice_items` or `bulk_choices`, but not both. See the per-type field endpoints for the field-specific settings reused by this generic endpoint.
