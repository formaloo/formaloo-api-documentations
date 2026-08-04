Triggers synchronization from Google Sheets into the linked form. Use this when a form is integrated with a sheet and the latest sheet data should be pulled into Formaloo.

## Async / Lifecycle

Reference polling pair with Google Sheets two-way sync status:

1. **This endpoint (`POST /sync-with-gsheet/`)** creates/registers the sync (or triggers sync registration).
2. **Next step:** the client must then call `GET /two-way-sync/google-sheets/{sheet_id}/{title}/` to poll actual sync status.

This is the documented reference pattern where a real polling/status endpoint exists — prefer this pair over endpoints that have no dedicated status URL.
