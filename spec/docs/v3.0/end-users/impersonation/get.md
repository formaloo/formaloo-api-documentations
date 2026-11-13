Reads the Login as banner for the current portal session. Send the portal authorization JWT and `x-scope`.

When that JWT is an open impersonation, `data.impersonation` has `display_name` and `expires_at`. Show “You are logged in as {display_name}”. A normal portal login, an ended session, or an expired session returns an empty object. Hide the banner. This read does not extend the 60 minutes.

## Example response (`200`)

```json
{
  "status": 200,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "impersonation": {
      "display_name": "Member",
      "expires_at": "2026-11-12T16:00:00+00:00"
    }
  }
}
```

## Normal login

```json
{
  "status": 200,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "impersonation": {}
  }
}
```
