Exports a form's submission data to Excel. Use this when a user needs an offline spreadsheet of responses for analysis, reporting, backup, or handoff.

## Async / Lifecycle

- **Status:** `201`
- **Body:** `{"form": {"async_export": bool, "excel_file": url|null}}`
- **Asynchronous:** conditional — small exports complete synchronously (`async_export: false`, `excel_file` populated immediately); large exports are queued (`async_export: true`, `excel_file: null`)
- **Next / poll:** no dedicated status endpoint exists. Clients must re-call this same endpoint (or an equivalent retrieval) to obtain the completed `excel_file` URL. This lack of a dedicated poll/status endpoint is a known gap.
