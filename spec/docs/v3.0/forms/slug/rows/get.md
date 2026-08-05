Lists submissions (rows) for a specific form in admin context. Use this for response inboxes, table views, search, filtering, sorting, and back-office review of collected data.

Sources of truth for filter behavior: Formaloo dashboard row fetchers (`formsRowsList` query params) and `formz_core` `RowQueryUtils` / `FormRowsView` (`date_filter_fields`, `timestamp_filter_fields`, `filter_fields`, plus `status` in `get_extra_filters`).

## Query parameters

### Pagination and text search

| Param | Description |
| --- | --- |
| `page` | 1-based page number |
| `page_size` | Results per page |
| `pagination` | Set to `0` to disable pagination |
| `search` | Case-insensitive search across submission values |
| `sort_by` | Comma-separated fields; prefix with `-` for descending (for example `-submit_time`, `-created_at`, or a field slug) |

### Submission status and meta filters

| Param | Description |
| --- | --- |
| `status` | Row status filter. Omit or use `all` for every status |
| `tags` | Comma-separated tag slugs |
| `tracking_code` | Exact tracking code |
| `submit_number` | Exact submit number |
| `created_by` | Match creator first name or email (icontains) |
| `updated_by` | Match last updater first name or email (icontains) |

### Date and timestamp ranges

Exact and range filters use the dashboard/`idealib` convention:

- Date fields (`created_at`, `updated_at`): exact `YYYY-MM-DD` via the bare param
- Timestamp fields (`submit_time`, `created_at`, `updated_at`): bare value or `*_lt` / `*_lte` / `*_gt` / `*_gte`

Examples:

- `?submit_time_gte=2024-01-01T00:00:00Z&submit_time_lte=2024-12-31T23:59:59Z`
- `?created_at_gte=2024-01-01T00:00:00Z`
- `?updated_at=2024-08-07` (date-only exact day filter when sent as a date field)

`submit_time` maps to the row `created_at` timestamp on the backend.

### Dynamic field filters

Any form field slug can be used as a query key. Operators follow `{fieldSlug}` or `{fieldSlug}_{operator}` (see `RowQueryUtils`):

| Operator suffix | Meaning |
| --- | --- |
| _(none)_ / `exact` / `equal` | Exact match (text fields default to case-insensitive exact) |
| `icontains` / `contains` / `has` | Contains |
| `not_contains` / `not_has` | Does not contain |
| `not_equal` | Not equal |
| `gt` / `gte` / `lt` / `lte` | Comparisons (numbers/dates) |

Comma-separated values on the bare field key become a list filter (for example `?city=NYC,LA`). There is no `_in` or `not_in` suffix in `RowQueryUtils`.

Examples:

- `?field_email=amir@example.com`
- `?field_email_icontains=example.com`
- `?satisfaction_gte=4`
- `?multi_select_has=choice_abc`
- `?city=NYC,LA`

Unknown keys that do not match a form field slug (or meta/order patterns) are ignored by `RowQueryUtils`.

## Response

`data` includes:

- `rows` — submission objects (answer keys are field slugs in `data` / `rendered_data`)
- `count` — total matching rows
- pagination fields (`next`, `previous`, `page_size`, `page_count`, `current_page`) when pagination is enabled
- `top_fields` — optional column hints for table UIs (form field references). Table columns are the form’s fields; when present, `top_fields` is the preferred column order for dashboards

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
    "top_fields": [
      { "slug": "field_JgKgX2vVPh", "title": "Name", "type": "short_text" },
      { "slug": "field_GFUOFRUTeg", "title": "Rating", "type": "dropdown" }
    ],
    "rows": [
      {
        "slug": "row_a1b2c3d4",
        "created_at": "2024-08-07T14:20:11.000000Z",
        "updated_at": "2024-08-07T14:20:11.000000Z",
        "data": {
          "field_JgKgX2vVPh": "Jane Doe",
          "field_GFUOFRUTeg": "choice_excellent"
        },
        "rendered_data": {
          "field_JgKgX2vVPh": "Jane Doe",
          "field_GFUOFRUTeg": "Excellent"
        }
      },
      {
        "slug": "row_e5f6g7h8",
        "created_at": "2024-08-07T15:02:44.000000Z",
        "updated_at": "2024-08-07T15:02:44.000000Z",
        "data": {
          "field_JgKgX2vVPh": "John Smith",
          "field_GFUOFRUTeg": "choice_good"
        },
        "rendered_data": {
          "field_JgKgX2vVPh": "John Smith",
          "field_GFUOFRUTeg": "Good"
        }
      }
    ]
  }
}
```
