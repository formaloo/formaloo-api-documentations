Requests regeneration of the AI summary content for an existing AI summary block. Use this after submissions, filters, or summary configuration change and the displayed insight should be refreshed.

## Async / Lifecycle

- **Status:** `202 Accepted`
- **Body:** empty `data`
- **Asynchronous:** yes — queued regeneration; no dedicated status endpoint
- **Next / poll:** no dedicated status or poll endpoint exists
- **Verification:** call `GET /boards/{board_slug}/blocks/{block_slug}/` and check whether the summary content has changed
