Lists users who have direct share access to a board and their access levels. Use this when auditing board permissions or showing the board-sharing management screen.

## Pending invitations

Next to `shared_profiles`, the response carries an `invitations` list holding the addresses the board was shared with that have not joined the workspace yet. They are two separate lists because an invitation has no profile behind it, only the email address and the access it will grant once the invitee joins.

```json
{
  "status": 200,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "shared_profiles": [],
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
```

Show invitations as pending entries in the share list. An invitation leaves `invitations` and turns up in `shared_profiles` once its invitee joins the workspace. Withdraw one with `DELETE /v3.0/access-invitations/{slug}/`, using the slug from this list.

Only invitations made on this board are listed. An invitation made on a parent folder is reported by that folder's own endpoint.
