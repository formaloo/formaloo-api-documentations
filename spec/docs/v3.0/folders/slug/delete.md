Deletes a folder from the workspace. Use this when removing an organizational container.

## Example response (`200` / `204`)

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

Confirm the folder `slug` with `GET /v3.0/folders/{slug}/` before deleting. Deleting a folder removes the organizational container; it does not replace form or board delete endpoints. For unused-form cleanup, use `GET /v3.0/forms/cleanup/` and `POST /v3.0/forms/cleanup/delete/`.
