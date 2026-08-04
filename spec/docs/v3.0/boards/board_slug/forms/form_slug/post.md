Performs an action on a specific form connected to a board. The current supported action is disconnecting the form from the board without deleting the form itself.

## Example request: disconnect form from board

```json
{
  "action": "disconnect"
}
```

`action` is required. The only documented value is `disconnect`.

## Example response (`201`)

```json
{
  "status": 201,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "slug": "kTX4WMpC",
    "title": "Customer Feedback"
  }
}
```

To attach a form to a new board/app, use `POST /v3.0/forms/{slug}/create-default-board/` or create a board with `POST /v3.0/boards/` and set `primary_form` to the form slug. To delete the board/app without deleting forms, use `DELETE /v3.0/boards/{boardSlug}/` with `delete_forms` omitted or `false`.
