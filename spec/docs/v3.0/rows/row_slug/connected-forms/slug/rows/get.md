Lists rows of one form that reference the given row through a Profile, Lookup, or Linked Rows field.

`row_slug` is the record being viewed. `slug` is the connected form chosen from the connected forms list. Both forms must belong to the active workspace and be accessible to the caller. The response is one hop only: a row that links onward to a third record is not expanded.

Each item is a submissions-table row. `rendered_data` is the display list for the preview line. A row linked through more than one field is returned once. The viewed row is left out, including when a field on its own form points back at it.

The default order is newest first (`position` descending, then `created_at` descending). `sort_by` overrides it. Search, pagination, and field filters match `formsRowsList`. Search covers the indexed submission text and the row slug.

Deleted rows are excluded. Drafts are included, as on the submissions table. A form with no connecting field returns `404`, as does a form or row the caller cannot access.

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
        "rendered_data": [
          {
            "title": "Company",
            "slug": "field_company",
            "value": "Google"
          }
        ],
        "data": {
          "field_company": "Google"
        }
      }
    ]
  }
}
```
