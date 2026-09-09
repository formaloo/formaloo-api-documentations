Creates or updates a folder-level share for a user. Use this when granting collaboration access to a folder so boards and content under that folder can be managed through inherited permissions.

## Sharing with someone who is not a workspace member yet

Access can only be held by a member of the workspace. When the address sent in `profile` does not belong to one, the call still succeeds and records an invitation instead of a share. The invitee receives the access automatically as soon as they join the workspace.

The response tells the two outcomes apart by the key it uses. An existing member is returned under `data.folder_user`; an address that is not a member yet is returned under `data.invitation`:

```json
{
  "status": 201,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "invitation": {
      "slug": "Zq4TvB8n",
      "email": "newcomer@example.com",
      "access": "editor",
      "created_at": "2026-09-09T19:41:02.418Z"
    }
  }
}
```

Show an invitation as a pending entry in the share list. It is listed by `GET /v3.0/folders/{slug}/folder-users/` under `invitations` and withdrawn with `DELETE /v3.0/access-invitations/{slug}/`.

This endpoint does not invite anyone to the workspace; that is a separate call. Recording an invitation here only reserves the folder access for the address.
