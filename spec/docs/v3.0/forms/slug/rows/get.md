Lists submissions for a specific form in admin context. Use this for response inboxes, table views, search, filtering, sorting, and back-office review of collected data.

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
    "page_size": 10,
    "page_count": 1,
    "current_page": 1,
    "rows": [
      {
        "slug": "row_a1b2c3d4",
        "created_at": "2024-08-07T14:20:11.000000Z",
        "updated_at": "2024-08-07T14:20:11.000000Z",
        "rendered_data": {
          "field_JgKgX2vVPh": "Jane Doe",
          "field_GFUOFRUTeg": "Excellent"
        }
      },
      {
        "slug": "row_e5f6g7h8",
        "created_at": "2024-08-07T15:02:44.000000Z",
        "updated_at": "2024-08-07T15:02:44.000000Z",
        "rendered_data": {
          "field_JgKgX2vVPh": "John Smith",
          "field_GFUOFRUTeg": "Good"
        }
      }
    ]
  }
}
```

Row answer keys are field slugs. Use search, pagination, and filter query parameters supported by the endpoint when building inbox or table views.
