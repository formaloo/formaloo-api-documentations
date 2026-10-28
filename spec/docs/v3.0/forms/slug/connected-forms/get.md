Lists forms in the active workspace that point at this form through a Profile, Lookup, or Linked Rows field, and that the caller can access.

The response is schema only. It does not read rows. Call it when opening Related records. An empty list means this form has no related records, so the Related records entry can stay hidden.

Pass a returned form slug to the connected rows endpoint to load that form's records.

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
    "forms": [
      {
        "slug": "form_workhistory",
        "title": "Work history",
        "address": "work-history",
        "full_form_address": "https://example.formaloo.net/work-history",
        "logo_url": null,
        "created_at": "2026-10-28T12:00:00Z",
        "updated_at": "2026-10-28T12:00:00Z"
      }
    ]
  }
}
```
