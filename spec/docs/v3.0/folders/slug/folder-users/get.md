Lists folder-share records for a folder and its lineage. Use this for detailed access-management screens where the client needs the actual folder permission records rather than only effective users.

## Pending invitations

Next to `folder_users`, the response carries an `invitations` list holding the addresses the folder was shared with that have not joined the workspace yet. They are two separate lists because an invitation has no profile behind it, only the email address and the access it will grant once the invitee joins.

```json
{
  "status": 200,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "folder_users": [],
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

Show invitations as pending entries in the share list. An invitation leaves `invitations` and turns up in `folder_users` once its invitee joins the workspace. Withdraw one with `DELETE /v3.0/access-invitations/{slug}/`, using the slug from this list.

Invitations follow the same lineage rule as the share records: those made on a parent folder are listed here too. The `profile` query parameter filters both lists, matching an invitation on its email address.
