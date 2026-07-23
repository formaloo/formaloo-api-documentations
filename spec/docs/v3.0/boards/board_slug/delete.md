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
