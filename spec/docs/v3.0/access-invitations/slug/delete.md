Cancels a pending access invitation to a folder, board/app, or form.

Sharing a resource with an email address that does not yet belong to a workspace member creates an invitation instead of a share. This endpoint withdraws that invitation, which is how a caller corrects a typo in the address or revokes access before the invitee ever joins. Once the invitee joins the workspace the invitation is consumed and turned into a real share, so from that point on the access is removed with the endpoint of the resource it belongs to (`DELETE /v3.0/folder-users/{slug}/`, `DELETE /v3.0/board-users/{slug}/`, or `DELETE /v3.0/form-shares/{slug}/`) instead.

The `slug` is the one returned in the `invitations` list of the resource's share-management endpoint. Only a caller with owner access to the folder, board, or form the invitation points at may cancel it.

This does not touch the workspace invitation itself. If the person was also invited to join the workspace, that invitation stays valid and they can still sign up; they simply will not receive access to this resource.

## Example response (`200`)

```json
{
  "status": 200,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {}
}
```

## Example error: caller is not an owner of the resource (`403`)

```json
{
  "status": 403,
  "errors": {
    "general_errors": [
      "You don't have owner permission on this resource."
    ],
    "form_errors": {}
  },
  "data": {}
}
```
