Creates a WhatsApp campaign draft, or starts it immediately when `mark_as_active` is true.

Use the `content_sid` of an approved template as `template_id`. Choose one recipient source: a form, a user-directory form, E.164 phone numbers, or a CSV/Excel upload. Template variables are numbered keys such as `{"1":"Formaloo"}`. Starting requires a template and at least one valid recipient.

`filters` narrows a `form` or `user_form` audience before phone numbers are snapshotted. It is the same object a form result block saves. `{}` or `null` sends every row. `fields_filters` keys are combined with AND and use the submission-filter operations (`exact`, `has`, `contains`, `empty`, and a `not_` prefix). `search`, `tags`, `status`, and `created_at`, `updated_at`, and `submit_time` (including `_lt`, `_lte`, `_gt`, and `_gte`) also select rows. `user_field`, `assignee_field`, and `sort_by` are stored and do not change who is included.

`filters` requires `form` or `user_form`. A pasted phone list or file import clears any stored filter. Sending `filters` with those sources, or with neither form audience, returns `400`. `mark_as_active` returns `400` when the filter matches no contacts.

```json
{
  "form": "application_form",
  "filters": {
    "fields_filters": {
      "city_exact": "Berlin"
    }
  }
}
```
