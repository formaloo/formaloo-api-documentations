Returns the latest sync status for a specific tab in a Google Sheets integration. Use this when the same spreadsheet contains multiple linked tabs and the client must disambiguate by sheet title.

## Async / Lifecycle

Polling/status endpoint for Google Sheets two-way sync (paired with `POST /sync-with-gsheet/`).

- **Role:** after creating/registering sync via `POST /sync-with-gsheet/`, call this `GET` to poll actual sync status for the given `sheet_id` and sheet `title`.
- This is the reference pattern in Form Maker where a dedicated status/poll endpoint exists.
