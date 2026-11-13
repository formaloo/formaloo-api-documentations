Exchanges the one-time code from Login as for a portal session. Call this from the portal tab as soon as `/auth/impersonate` opens. Send the application API key only. Do not send a workspace session or a portal JWT.

The code works once and expires 60 seconds after the directory call. A second use, or a late use, returns `400` and does not issue a token. The owner starts again from the directory.

`session_token` is the same kind of token confirm-login returns. Do not send it to Formz. Exchange it on `POST /v3.0/end-users/authorize/`, then send that authorization JWT on later portal requests with `x-scope` set to the user directory slug. The session lasts 60 minutes from this call, not from the directory click. The nested impersonation object is the first paint of the banner.

## Example request

```json
{
  "code": "one-time-code"
}
```

## Example response (`201`)

```json
{
  "status": 201,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "impersonation": {
      "session_token": "session-token",
      "impersonation": {
        "display_name": "Member",
        "expires_at": "2026-11-12T16:00:00+00:00"
      }
    }
  }
}
```
