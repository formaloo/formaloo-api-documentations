Creates a new email campaign in draft form. Use this when preparing bulk email content and audience targeting from manual email lists, uploaded recipient files, or a form or user-directory audience.

`filters` narrows a `form` or `user_form` audience before the recipient snapshot is stored. It is the same object a form result block saves. `{}` or `null` sends every row. `fields_filters` keys are combined with AND and use the same field-slug operations as submission filters (`exact`, `has`, `contains`, `empty`, and a `not_` prefix). `search`, `tags`, `status`, and `created_at`, `updated_at`, and `submit_time` (including `_lt`, `_lte`, `_gt`, and `_gte`) also select rows. `user_field`, `assignee_field`, and `sort_by` are stored and do not change who is included.

`filters` requires `form` or `user_form`. A pasted address list or file import clears any stored filter. Sending `filters` with those sources, or with neither form audience, returns `400`.

```json
{
  "form": "application_form",
  "filters": {
    "fields_filters": {
      "city_exact": "Berlin"
    },
    "submit_time_gte": "2024-01-01T00:00:00Z"
  }
}
```
