## Row vote toggle

`POST /v5/rows/{row_slug}/vote/`

Toggle the current user's vote on a row. First call creates the vote, next call (same user, same row) removes it. Idempotence is at the user+row pair, not at the request level.

### Path parameters
- `row_slug` — slug of the target `Row`.

### Query parameters
Supply exactly one context, matching the caller type:

- Business user (team member / owner):
  - `current_board` — slug of a board the user has read access to, and that the row's form belongs to. Required when the user's read access to the form is granted via a board rather than directly.
- Portal end user (end-user group, accessing through a shared board):
  - `block_slug` — slug of the `FormResultBlock` or `KanbanBlock` under that board that the portal user edits through.

### Request body
None. The action is derived from the current vote state.

### Response
`201 Created`

```json
{
  "data": {
    "row": {
      "voted": true,
      "vote_count": 1
    }
  }
}
```

- `voted` — `true` if a vote now exists for the caller on this row after the toggle, `false` if it was removed.
- `vote_count` — total vote count on the row after the toggle (denormalized on `Row`, consistent with `RowVote` rows).

### Error responses
- `401 Unauthorized` — caller is not authenticated.
- `403 Forbidden` — caller is authenticated but does not satisfy either access path:
  - business path requires `Authenticated & HasBusiness & CanReadForm`;
  - portal path requires `Authenticated & CanEditBlockRow` (end-user group, `block_slug`/`board_share_address` present, the block is `FORM_RESULT` or `KANBAN`, `user_can_edit=True`, and the caller's `username` matches the row's value for the block's configured `user_field` filter).
- `404 Not Found` — `row_slug` does not match any existing row.

### Related read surfaces
- `GET /v5/rows/{slug}/` — row detail includes `vote_count` and `user_voted` (computed for the caller).
- `GET /v5/boards/{board_slug}/blocks/{block_slug}/content/` for a `FormResultBlock`, and `GET /v5/forms/{slug}/rows/` (`get_form_submits`) — list responses include `vote_count`, but `user_voted` is always `null` on these endpoints by design (skipped for performance). Clients that need per-row `user_voted` in a list context must use a surface that opts in (e.g. Kanban content or the row detail endpoint).
- Sort by vote count on list endpoints with `?sort_by=-vote_count`.

### Semantics notes
- `(row, user)` is unique; duplicate `RowVote` creation raises a DB integrity error and is surfaced as a server error, not a client validation error. Clients must not assume idempotent "create"; always treat the endpoint as a toggle.
- `vote_count` is maintained on the `Row` model itself; concurrent toggles for the same user on the same row are serialized inside a DB transaction.