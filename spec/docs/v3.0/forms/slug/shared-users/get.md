Lists users who have access to a form through direct sharing. Use this for form permission audits and share-management screens.

## Pending invitations

Next to `shared_profiles`, the response carries an `invitations` list holding the addresses the form was shared with that have not joined the workspace yet. They are two separate lists because an invitation has no profile behind it, only the email address and the access it will grant once the invitee joins.

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

`shared_profiles` is paginated, `invitations` is not: the whole list is returned on every page. Only invitations made on this form are listed; those made on a parent board or folder are reported by their own endpoints.
