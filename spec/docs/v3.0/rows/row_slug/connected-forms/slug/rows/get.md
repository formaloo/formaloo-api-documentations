Lists rows of one form that reference the given row through a Profile, Lookup, or Linked Rows field.

`row_slug` is the record being viewed. `slug` is the connected form chosen from the connected forms list. Both forms must belong to the active workspace and be accessible to the caller. The response is one hop only: a row that links onward to a third record is not expanded.

A row linked through more than one field is returned once. The viewed row is left out, including when a field on its own form points back at it. A form with no connecting field returns `404`, as does a form or row the caller cannot access.

Pagination, search, sorting, and field filters match `formsRowsList`.

## Example response (`200`)

```json
{
  "status": 200,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "count": 1,
    "next": null,
    "previous": null,
    "page_size": 10,
    "page_count": 1,
    "current_page": 1,
    "rows": [
      {
        "slug": "row_work_1",
        "form": "form_workhistory",
        "created_at": "2026-10-28T12:00:00Z",
        "data": {
          "field_company": "Google"
        }
      }
    ]
  }
}
```
