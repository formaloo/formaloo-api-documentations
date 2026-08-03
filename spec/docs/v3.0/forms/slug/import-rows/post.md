Imports submission rows into an existing form from a spreadsheet. Use this when migrating historical data, bulk-loading records, or populating a form-backed database.

## Async / Lifecycle

- **Request media type:** `multipart/form-data`, field `file` (`.xlsx` / `.xls`)
- **Status:** `201`
- **Body:** standard JSON envelope; includes `"create_type": "sync"|"async"` per form/import payload
- **Asynchronous:** conditional on row/column volume
- **Next / poll:** no dedicated job-status endpoint exists
- **Verification:** call `GET /forms/{slug}/rows/` (row count) or `GET /forms/{slug}/` afterward
