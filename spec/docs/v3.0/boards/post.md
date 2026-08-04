Creates a new board in the active workspace. Use this when provisioning an app, dashboard, portal, or workflow container that can later hold blocks, forms, menus, and sharing rules.

## Example request: create a board attached to a form

```json
{
  "title": "Customer Feedback App",
  "description": "Responses and workflow for the feedback form.",
  "primary_form": "kTX4WMpC",
  "folder": "3r2nfcn2"
}
```

`primary_form` is the form slug to attach as the board's primary form. `folder` is optional.

## Example response (`201`)

```json
{
  "status": 201,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "board": {
      "slug": "vH0sFkTF",
      "title": "Customer Feedback App",
      "description": "Responses and workflow for the feedback form.",
      "is_primary": false,
      "primary_form": {
        "slug": "kTX4WMpC",
        "title": "Customer Feedback",
        "address": "oukll",
        "form_type": "simple"
      },
      "folder": "3r2nfcn2"
    }
  }
}
```

For an existing form that needs a default app/board quickly, prefer `POST /v3.0/forms/{slug}/create-default-board/`. To disconnect a form from a board later, use `POST /v3.0/boards/{boardSlug}/forms/{formSlug}/` with `{ "action": "disconnect" }`.

