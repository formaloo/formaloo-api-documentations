Grants or updates direct access to a board for collaborators. Use this when sharing a specific app with users by email and assigning their access level, instead of relying on folder-level inheritance.

## Sharing with someone who is not a workspace member yet

Access can only be held by a member of the workspace. Addresses in `profiles` that do not belong to one are recorded as invitations instead of shares, and each invitee receives the access automatically as soon as they join the workspace. A list mixing known and unknown addresses succeeds as a whole; an unknown address no longer fails the request.

The response reports the two outcomes separately. `profiles` holds the collaborators who were granted access straight away, `invitations` the addresses still waiting to join:

```json
{
  "status": 201,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "profiles": {
      "access": "editor",
      "profiles": [
        { "email": "teammate@example.com" }
      ],
      "invitations": [
        {
          "slug": "Zq4TvB8n",
          "email": "newcomer@example.com",
          "access": "editor",
          "created_at": "2026-09-09T19:41:02.418Z"
        }
      ]
    }
  }
}
```

Show an invitation as a pending entry in the share list. Invitations are listed by `GET /v3.0/boards/{slug}/shared-users/` under `invitations` and withdrawn with `DELETE /v3.0/access-invitations/{slug}/`.

Sending the same address again updates the access level of its existing invitation rather than creating a second one. This endpoint does not invite anyone to the workspace; that is a separate call.
