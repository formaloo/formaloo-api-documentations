Lists forms in the active workspace that point at this form through a Profile, Lookup, or Linked Rows field, and that the caller can access.

Pass the form slug of the record being viewed. The client already has that slug. The response is schema only and does not read rows, so an empty list means this form has no related records and the Related records entry can stay hidden.

Pass `exists=true` to decide whether to show that entry without loading the list. `data` then contains only `has_connected_forms`. `true` means the caller can open at least one connected form. `exists=false` and an omitted `exists` return the list.

Results are ordered by title. This list does not accept `search`. It does not return a per-record row count or the linking field names.

`shared_access` is the caller's access to that form. `owner` and `editor` can change its rows. Pass a returned form slug to the connected rows endpoint to load that form's records.

Deleted forms are excluded. Team members only see forms they can open. Portal users are not included. `has_connected_forms` uses that same access check.

## Example response (`200`, `exists=true`)

```json
{
  "status": 200,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "has_connected_forms": true
  }
}
```

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
        "shared_access": "owner",
        "created_at": "2026-10-28T12:00:00Z",
        "updated_at": "2026-10-28T12:00:00Z"
      }
    ]
  }
}
```
