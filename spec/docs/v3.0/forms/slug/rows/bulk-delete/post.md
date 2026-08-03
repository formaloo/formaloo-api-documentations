Bulk-deletes submission rows from a form.

Send explicit row slugs in `slugs_list`:

```json
{
  "slugs_list": ["row_slug_1", "row_slug_2"]
}
```

Use this only when the user intends to remove multiple submissions from the form.

## Behavior

This is a bulk delete via `POST` (not a `DELETE` verb). Request body includes `slugs_list`. Returns `200` with an empty `data` object on success. There is no separate confirmation step.
