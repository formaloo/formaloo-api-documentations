Creates a multiple-select field. Use this when respondents can choose more than one option from a fixed list.

Supported `sub_type` values:

| Field variant | `sub_type` |
| --- | --- |
| Multiple choice | `standard` |
| Multiple choice dropdown | `dropdown` |
| Ranking | `ranking` |

Choices can be supplied in either of two ways:

- `choice_items`: explicit choice objects, for example `{ "title": "Enterprise" }`.
- `bulk_choices`: a list of labels or a newline-separated string.

Do not send `choice_items` and `bulk_choices` in the same request. When submitting or updating rows, multiple-select values should be sent as a list of choice slugs.

Example ranking field:

```json
{
  "form": "customer-feedback",
  "title": "Rank these priorities",
  "sub_type": "ranking",
  "choice_items": [
    { "title": "Speed" },
    { "title": "Price" },
    { "title": "Support" }
  ]
}
```
