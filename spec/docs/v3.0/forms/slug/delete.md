Deletes a form and its submission data. Use this only when the user intends to remove the form resource itself, not merely disconnect it from a board.

## Safe deletion guidance

- Disconnect a form from a board with `POST /v3.0/boards/{boardSlug}/forms/{formSlug}/` when you only need to remove the board relationship.
- Delete a board without deleting its forms with `DELETE /v3.0/boards/{boardSlug}/` (`delete_forms` omitted or `false`).
- For bulk cleanup of unused/inactive forms, prefer `GET /v3.0/forms/cleanup/` then `POST /v3.0/forms/cleanup/delete/`.

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

This permanently removes the form resource for the caller. Confirm the form `slug` with `GET /v3.0/forms/{slug}/` before deleting.
