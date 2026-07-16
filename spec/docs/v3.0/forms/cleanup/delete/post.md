# Delete cleanup forms

`POST /v3.0/forms/cleanup/delete/`

Bulk-deletes forms by explicit slugs or by selecting an entire cleanup category. Deletion is queued asynchronously and returns immediately with a batch identifier.

Requires workspace owner (or admin with business-owner permission). Forms already marked pending deletion are excluded from the accepted count. Forms are soft-deleted.

## Request body

Provide either explicit slugs **or** select-all. Do not send both.

### Option 1: Explicit slugs

```json
{
  "form_slugs": ["form-1", "form-2", "form-3"]
}
```

### Option 2: Select all in a category

```json
{
  "select_all": true,
  "category": "old_no_responses"
}
```

### Option 3: Select all with exclusions

```json
{
  "select_all": true,
  "category": "inactive",
  "exclude_slugs": ["keep-this-one", "keep-that-one"]
}
```

## Request fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `form_slugs` | array[string] | Conditional | Form slugs to delete. Required when `select_all` is not used |
| `select_all` | boolean | Conditional | Delete all forms in the category. Required when `form_slugs` is not provided |
| `category` | string | Conditional | Required when `select_all` is true. One of `old_no_responses`, `inactive`, `unused` |
| `exclude_slugs` | array[string] | No | Slugs to keep when using `select_all` |

## Validation

1. Cannot specify both `form_slugs` and `select_all`
2. Must specify either `form_slugs` or `select_all`
3. `select_all` requires `category`
4. Already-pending forms are skipped and not counted

## Response (`201`)

| Field | Type | Description |
|-------|------|-------------|
| `batch_id` | string \| null | Deletion batch ID for tracking; `null` when nothing was queued |
| `accepted_count` | integer | Number of forms queued for deletion |
| `message` | string | Human-readable status |

## Background processing

1. API returns immediately after queuing
2. Forms are marked pending deletion and hidden from cleanup lists, dashboard form lists, and category counts
3. A background worker deletes forms one-by-one (soft delete / cascade)
4. Pending state is cleared after each form is processed
5. If a deletion fails, that form’s pending state is cleared so it reappears and can be retried

Queued deletions cannot be cancelled. Soft-deleted forms can be recovered by administrators if needed.

One request targets a single category or an explicit slug list. Use separate calls for multiple categories.

## Errors

- `400` — Validation failure (for example both `form_slugs` and `select_all`, or missing `category` with `select_all`)
- `403` — Caller is not a workspace owner/admin

## Auth

Authenticated request with `Authorization` and `x-api-key`. Workspace owner/admin only.
