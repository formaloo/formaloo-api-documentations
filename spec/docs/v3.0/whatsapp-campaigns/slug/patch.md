Partially updates a WhatsApp campaign.

Retrieve the campaign first and preserve fields the user did not ask to change. Recipient sources are mutually exclusive. Setting `mark_as_active` starts sending and requires an approved template plus at least one valid contact.

Only a draft accepts edits. Changing `filters` on a form or user-directory audience rebuilds `contacts` and `total_contacts` from the rows that match. `{}` or `null` sends every row. The object matches a form result block filter: `fields_filters` keys are AND and use the submission-filter operations, and `search`, `tags`, `status`, and the `created_at`, `updated_at`, and `submit_time` bounds also select rows. `user_field`, `assignee_field`, and `sort_by` stay stored and do not change the recipient list.

`filters` requires `form` or `user_form`. Switching the audience to `user_phones` or `users_file` clears the stored filter. Sending `filters` with those sources, or with no form audience, returns `400`. `mark_as_active` returns `400` when the filter matches no contacts. A form audience with an empty filter and no rows can still be started.
