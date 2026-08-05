Bulk-deletes submission rows from a form.

Send explicit row slugs in `slugs_list`:

```json
{
  "slugs_list": ["row_slug_1", "row_slug_2"]
}
```

Use this only when the user intends to remove multiple submissions from the form.

## Behavior

This is a bulk delete via `POST` (not a `DELETE` verb). Request body must include `slugs_list` (array of row/submission slugs). Returns success with an empty `data` object. The HTTP API does not add a confirmation flag; agent clients (Formaloo MCP) should require an explicit `confirm=true` before calling this operation.
