Creates a form from a natural-language prompt. Use this when an agent has a user description of the desired form and should generate the initial structure automatically.

## Async / Lifecycle

- **Status:** `201`
- **Body:** includes `"create_type": "sync"|"async"` per form/import payload
- **Asynchronous:** conditional on row/column volume
- **Next / poll:** no dedicated job-status endpoint exists
- **Verification:** call `GET /forms/{slug}/rows/` (row count) or `GET /forms/{slug}/` afterward
