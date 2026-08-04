Creates a lookup field that reads values from another form's field.

API v5 requires both:

- `related_form`: slug of the form containing the source field.
- `field`: slug of the source field within `related_form`.

Use exact slugs, not titles or aliases. To discover selectable values after
creation, call `GET /v3.0/fields/{slug}/choices/`; it supports the `search`
query parameter and returns the field's runtime choice representation.
