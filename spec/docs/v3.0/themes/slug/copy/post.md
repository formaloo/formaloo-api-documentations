Copies a form theme into the active business. Use this when forking a system theme or existing workspace theme before customization.

Request body is optional:

```json
{
  "title": "Custom copy title"
}
```

If `title` is omitted, the copied theme's current title is reused. The response returns the new theme with its own `slug`; assign that slug to a form through the form `theme` field.
