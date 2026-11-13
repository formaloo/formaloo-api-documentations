Starts Login as for one User Directory row. The caller must be able to edit that directory: a workspace owner, an admin, or a member with edit access.

Open `login_url` in a new tab. It is the portal address plus `/auth/impersonate?code=...`. The code lasts 60 seconds and works once. Starting again issues a new code. This call does not sign the owner out, does not change last login, and does not send a login email.

When the directory has more than one portal, send `board` with that portal's share address. With one portal, omit it. `can_sign_in` is false when the account is inactive. The code is still valid. The tab should warn that this user cannot sign in themselves.

## Example request

```json
{
  "board": "portal-share-address"
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
      "login_url": "https://portal.example.com/auth/impersonate?code=one-time-code",
      "expires_in": 60,
      "can_sign_in": true
    }
  }
}
```

## Example error: more than one portal

```json
{
  "status": 400,
  "errors": {
    "general_errors": [],
    "form_errors": {
      "board": ["Choose a portal. This directory has more than one."]
    }
  },
  "data": {}
}
```

A row that is not a portal user, a directory with no portal, an unknown `board`, or a portal with no public address is also `400`. Missing edit access is `403`. An unknown row is `404`.
