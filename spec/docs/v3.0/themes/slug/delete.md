Deletes a business-owned form theme.

If the theme is used by forms, send `replace_with_theme` to move those forms to another theme before deletion:

```json
{
  "replace_with_theme": "replacement-theme-slug"
}
```

`replace_with_theme` must be a theme slug from the same workspace or a system theme. If it is omitted, linked forms are left without this assigned reusable theme after deletion. Before deleting a theme through MCP/CLI, list or inspect the forms using it and confirm whether they should be moved to a replacement theme.
