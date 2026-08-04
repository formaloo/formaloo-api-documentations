Creates a form using AI-assisted import from an external URL. Use this when an agent should turn an existing webpage or external form into a Formaloo form draft.

## Async / Lifecycle

- **Status:** `201`
- **Body:** includes `"create_type": "sync"|"async"` per form/import payload
- **Asynchronous:** conditional on row/column volume
- **Next / poll:** no dedicated job-status endpoint exists
- **Verification:** call `GET /forms/{slug}/rows/` (row count) or `GET /forms/{slug}/` afterward
