## Row vote toggle

`POST /v5/rows/{row_slug}/vote/`

Toggle the current user's vote on a row. First call creates the vote, next call (same user, same row) removes it. Idempotence is at the user+row pair, not at the request level.

### Path parameters
- `row_slug` — slug of the target `Row`.

### Query parameters
- `block_slug` (required) — slug of the `FormResultBlock` or `KanbanBlock` that scopes this vote action. The block's `voting_status` gates who may vote.

### Request body
None. The action is derived from the current vote state.

### Response
`201 Created`

```json
{
  "data": {
    "row": {
      "user_voted": true,
      "vote_count": 1
    }
  }
}
```

- `user_voted` — `true` if a vote now exists for the caller on this row after the toggle, `false` if it was removed.
- `vote_count` — total vote count on the row after the toggle (denormalized on `Row`, consistent with `RowVote` rows).

### Access control
Enforced by `HasVotePermission` (object-level). All of the following must hold:

- Caller is authenticated.
- `block_slug` query parameter is present and resolves to an existing `KanbanBlock`.
- The block's `voting_status` is not `disabled`.
- The caller satisfies the branch selected by `voting_status`:
  - `for_internal_users`: Current user is an internal user.
  - `for_external_users`: Current user is an external user.

### Error responses
- `401 Unauthorized` — caller is not authenticated.
- `403 Forbidden` — any of the access checks above fails.
- `404 Not Found` — `row_slug` does not match any existing row.

### Related read surfaces
Per-row `user_voted` is only included when the consuming view opts into `include_user_voted`. The opt-in rules, keyed off the block's `voting_status`:

- `GET /v5/rows/{slug}/` (row detail) — always includes `vote_count` and `user_voted` (computed for the caller).
- `GET /v5/boards/{board_slug}/blocks/{block_slug}/content/` (admin block content, `FormResultBlock` and `KanbanBlock`) — `user_voted` is populated only when `voting_status = for_internal_users`. Otherwise it is `null`.
- `GET /v5/shared-boards/{board_share_address}/blocks/{block_slug}/content/` (shared/public block content) — `user_voted` is populated only when `voting_status = for_external_users`. Otherwise it is `null`.
- `GET /v5/forms/{slug}/rows/` (`get_form_submits`) — `vote_count` is included; `user_voted` is always `null` by design.
- Sort by vote count on list endpoints with `?sort_by=-vote_count`.
