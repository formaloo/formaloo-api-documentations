Lists forms the authenticated user can access in the active workspace. Use this as the primary form catalog endpoint for dashboards, selectors, search, filtering by tags/folders/boards, and discovering forms owned by or shared with the user.

## Example response (`200`)

```json
{
  "status": 200,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "count": 2,
    "next": null,
    "previous": null,
    "page_size": 12,
    "page_count": 1,
    "current_page": 1,
    "forms": [
      {
        "slug": "cv7kTWdv",
        "address": "vxag2",
        "title": "Customer Feedback",
        "form_type": "simple",
        "active": true,
        "submit_count": 0,
        "total_submits_count": 0,
        "category": null
      },
      {
        "slug": "goStqGhTmsnwDWa",
        "address": "c52wu",
        "title": "NPS Survey",
        "form_type": "simple",
        "active": true,
        "submit_count": 75,
        "total_submits_count": 75,
        "category": null
      }
    ]
  }
}
```

Common query parameters include `search`, `page`, and access filters. Use the returned `slug` values with form detail, field, row, and board endpoints.
