Replaces editable row data. Use this when saving a complete submission edit in admin context.

Send editable field values as top-level keys using field slugs, the same shape used when creating a row. You may also send row-level fields such as `row_tags`, `previous_position`, or `next_position`.

Updating a row can run update logic and trigger configured post-update activities such as webhooks, emails, Slack events, or PDF generation.
