Lists delivery attempts for one outbound form webhook, including form submit, row update, and payment events.

Events are created when Formaloo sends the webhook. This endpoint is read-only: callers cannot create, edit, or delete them. A webhook the caller cannot access returns 404.

The list omits the delivery body. Use the event detail endpoint for `data` and `error_logs`. Each item includes the related row:

```json
{
  "slug": "row-slug",
  "form": "form-slug"
}
```

`form` is the form slug. `row` is null when the event has no row.

There is no text search. Filter by status, event type, and the created or sent time range. Results are paginated, newest first.

Delivery bodies are cleared about 30 days after the event is created. Status, retry count, and error logs remain.
