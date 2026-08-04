Regenerates the Google Sheet data connected to a form. Use this when sheet structure or synced data should be rebuilt after form changes or sync problems.

## Async / Lifecycle

- **Status:** `202 Accepted`
- **Body:** empty `data`
- **Asynchronous:** yes — queued as a background job
- **Next / poll:** no dedicated status or poll endpoint exists
- **Verification:** call `GET /forms/{slug}/` afterward and check the form's Google Sheets data for the update; there is no explicit "done" signal
