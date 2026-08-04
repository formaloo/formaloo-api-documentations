Creates a new form by importing spreadsheet data from an uploaded Excel file or Google Sheet. Use this when bootstrapping a form and its initial structure from tabular data.

## Async / Lifecycle

- **Request media type:** either `multipart/form-data` (file upload) or JSON (`url` to a Google Sheet + optional `sheet_range`)
- **Status:** `201`
- **Body:** standard JSON envelope; includes `"create_type": "sync"|"async"` per form/import payload. Response is JSON (not a raw file).
- **Asynchronous:** conditional on row/column volume
- **Next / poll:** no dedicated job-status endpoint exists
- **Verification:** call `GET /forms/{slug}/rows/` (row count) or `GET /forms/{slug}/` afterward for the created form
