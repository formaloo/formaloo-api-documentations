Creates a dropdown single-select field. Use this when the option list is long or the UI should remain compact while still allowing only one selected answer.

Choices can be supplied in either of two ways:

- `choice_items`: explicit choice objects, for example `{ "title": "Enterprise" }`.
- `bulk_choices`: a list of labels or a newline-separated string.

Do not send `choice_items` and `bulk_choices` in the same request. For updates, include existing choice `slug` values for choices that should remain.
