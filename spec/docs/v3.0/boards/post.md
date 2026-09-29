Creates a new board in the active workspace. Use this when provisioning an app, dashboard, portal, or workflow container that can later hold blocks, forms, menus, and sharing rules.

Boards are shown as apps in the Formaloo product UI. Use this endpoint for the app shell, then create blocks and menu items/pages to build the app experience.

Common app shell fields:

- `title`, `description`: user-facing app identity.
- `is_public`: public/shareable app flag. Use `false` for private workspace apps and `true` when the app should be publicly shareable.
- `share_address`, `custom_domain`: public address settings. Keep an existing `share_address` unless intentionally changing or rotating it.
- `thumbnail_slug`, `banner_slug`, `logo_slug`, `icon_slug`: Formaloo file slugs returned by the file service. File URLs are display/readback metadata; write the slug fields.
- `config`: app-level dashboard configuration. Retrieve the app first and preserve existing keys when changing one nested value.
- `theme_config`: app theme configuration. Retrieve the app first and preserve existing keys when changing one nested value.
- `user_form`: portal/member identity form slug.
- `primary_form`: numeric form id of the primary workflow form. This is not the form slug. Omit it when only the slug is known and put that slug on the block instead. The response returns `primary_form` as a form object.

## Example request: create a board attached to a form

```json
{
  "title": "Customer Feedback App",
  "description": "Responses and workflow for the feedback form.",
  "primary_form": 120451,
  "folder": "3r2nfcn2"
}
```

`primary_form` is the numeric form id, not the form slug. A slug is rejected. Omit `primary_form` when only the slug is known. `folder` is optional.

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
