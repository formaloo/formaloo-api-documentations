Deletes a board, also shown as an app in the Formaloo UI.

By default, this deletes only the board/app. Connected forms are not deleted.

To also delete forms connected to the board, send `delete_forms=true` as a query parameter or request body:

```http
DELETE /v3.0/boards/{boardSlug}/?delete_forms=true
```

```json
{
  "delete_forms": true
}
```

When `delete_forms` is true, the backend queues deletion of the board's connected forms and primary form. MCP/CLI clients should ask for explicit confirmation before setting this flag.

## Example response (`200`)

```json
{
  "status": 200,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {}
}
```

## Example error: primary board cannot be deleted via some legacy paths

```json
{
  "status": 400,
  "errors": {
    "general_errors": [],
    "form_errors": [
      "Can't delete the primary board!"
    ]
  },
  "data": {}
}
```

Prefer `DELETE /v3.0/boards/{boardSlug}/` for current board/app deletion. Keep `delete_forms` false unless the caller explicitly wants forms removed too.

## Async / Lifecycle

Returns `200` with an empty `data` object. Asynchronous: conditional. If the request includes `delete_forms: true`, deletion of the board's forms is queued as a background job (fire-and-forget); the `200` response does not wait for that cleanup to finish. There is no dedicated status or poll endpoint for the form-cleanup job.
