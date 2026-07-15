# List cleanup forms

`GET /v3.0/forms/cleanup/`

Lists forms in a specific workspace cleanup category. Use this for workspace hygiene screens that identify unused, inactive, or old forms with no recent activity.

Requires workspace owner (or admin with business-owner permission). Forms currently queued for background deletion are excluded automatically.

## Categories

Forms are classified into three mutually exclusive categories (priority order):

| Priority | Key | Description | Criteria |
|----------|-----|-------------|----------|
| 1 | `old_no_responses` | Created over 365 days ago with zero submissions | `created_at < now - 365 days` and `total_submits_count = 0` |
| 2 | `inactive` | Has submissions, but none in the last 365 days | `total_submits_count > 0`, `last_submit_time < now - 365 days`, and not in priority 1 |
| 3 | `unused` | Zero submissions; created and updated over 90 days ago | `created_at < now - 90 days`, `updated_at < now - 90 days`, `total_submits_count = 0`, and not in priorities 1–2 |

## Query parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | Yes | Category key: `old_no_responses`, `inactive`, or `unused` |
| `search` | string | No | Search by form title or slug |
| `sort` | string | No | Sort field: `created_at`, `updated_at`, `last_submit_time`, or `title`. Prefix with `-` for descending |
| `limit` | integer | No | Items per page (default: 20) |
| `offset` | integer | No | Pagination offset |

## Response (`data`)

| Field | Description |
|-------|-------------|
| `forms` | Paginated list of forms in the requested category |
| `category_counts` | Counts for all three categories (`old_no_responses`, `inactive`, `unused`) |
| `count` | Total forms in the requested category (after pending exclusion) |
| `next` / `previous` | Pagination links |

Each form item includes `slug`, `title`, `created_at`, `updated_at`, `last_submit_time`, `total_submits_count`, `category` (folder), and `owner`.

Example:

```json
{
  "status": "OK",
  "code": 200,
  "data": {
    "forms": [
      {
        "slug": "old-form-1",
        "title": "Old Survey Form",
        "created_at": "2023-01-15T10:30:00Z",
        "updated_at": "2023-01-20T14:45:00Z",
        "last_submit_time": null,
        "total_submits_count": 0,
        "category": {
          "slug": "surveys",
          "title": "Surveys"
        },
        "owner": {
          "username": "user@example.com",
          "first_name": "John",
          "last_name": "Doe"
        }
      }
    ],
    "category_counts": {
      "old_no_responses": 45,
      "inactive": 23,
      "unused": 12
    },
    "count": 45,
    "next": "/v3.0/forms/cleanup/?category=old_no_responses&offset=20",
    "previous": null
  }
}
```

## Behavior

- Pending deletions are excluded from the list and from `category_counts`.
- Category membership is mutually exclusive; a form appears in at most one category.
- Scoped to the authenticated workspace (`x-workspace` / API key workspace context).

## Errors

- `400` — Missing or invalid `category`
- `403` — Caller is not a workspace owner/admin

## Auth

Authenticated request with `Authorization` and `x-api-key`. Workspace owner/admin only.
