Creates a new pdf generator api.

## Behavior

- **Status:** `201`
- **Response:** JSON (not raw PDF bytes) — `data` is a URL string pointing to the generated PDF
- Clients must not expect a binary PDF response body; fetch the PDF from the returned URL
