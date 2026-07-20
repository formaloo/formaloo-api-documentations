Creates a reusable v5 theme from a form's current visual styling. Use this when a form's look should become a preset that can be applied to other forms.

Request body is optional:

```json
{
  "title": "Customer feedback theme"
}
```

If `title` is omitted, the source form title is used. The created theme belongs to the active workspace and can later be assigned to forms by sending its `slug` as the form `theme` field.
