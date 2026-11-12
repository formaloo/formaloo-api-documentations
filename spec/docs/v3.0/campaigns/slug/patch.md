Partially updates a campaign. Use this for incremental changes such as editing content, changing the recipient source, or marking a draft campaign active.

Only a draft accepts edits. Changing `filters` on a form or user-directory audience rebuilds `contacts` and `total_contacts` from the rows that match. `{}` or `null` sends every row. The object matches a form result block filter: `fields_filters` keys are AND and use the submission-filter operations, and `search`, `tags`, `status`, and the `created_at`, `updated_at`, and `submit_time` bounds also select rows. `user_field`, `assignee_field`, and `sort_by` stay stored and do not change the recipient list.

`filters` requires `form` or `user_form`. Switching the audience to `user_emails` or `users_file` clears the stored filter. Sending `filters` with those sources, or with no form audience, returns `400`. `mark_as_active` returns `400` when the filter matches no contacts. A form audience with an empty filter and no rows can still be started.

```json
{
  "filters": {
    "fields_filters": {
      "city_exact": "Berlin"
    }
  }
}
```
