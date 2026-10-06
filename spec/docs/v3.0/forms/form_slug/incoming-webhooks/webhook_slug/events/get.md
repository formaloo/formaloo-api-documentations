Lists requests received by one incoming webhook, including successful row changes, sample captures, and failures.

Formaloo records a request when it reaches an existing webhook. This endpoint is read-only. A webhook the caller cannot access returns 404.

The list omits the request body. Use the event detail endpoint for `payload` and `error_logs`. When the request created or updated a row, `row` is:

```json
{
  "slug": "row-slug",
  "form": "form-slug"
}
```

`form` is the form slug. `row` is null for sample captures, failures, and any request that did not change a row.

Authentication failures are stored with no payload. The public receive endpoint answers 403 for a bad secret, because that endpoint has no Formaloo authentication scheme, while the stored `status_code` remains 401.

There is no text search. Filter by status, HTTP status code, result, and created time. Results are paginated, newest first.

Request bodies are removed about 30 days after the event is created. Status and error logs remain.
