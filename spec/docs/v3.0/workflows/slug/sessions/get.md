Lists the sessions opened for a workflow.

A session is one run of the workflow, opened when a row is submitted on a starting-point form. Use this to see which runs exist and which row opened each one. Linked rows and the event log are on the session detail.

## Access

The profile that created the workflow, and owners and admins of the workspace, can read sessions. A workspace member who did not create the workflow receives `403`.

Authentication and the `x-workspace` header follow the other workflow endpoints. The workflow must belong to that workspace.

## Path params

- `slug`: workflow slug

## Common query params

- `search`: session slug, entry node key, or opening row slug
- `entry_node_key`: blueprint node that opened the session
- `sort_by`: `created_at`, `updated_at`, or `entry_node_key`. Prefix with `-` for descending.
- `pagination`: page number. `0` returns the full list.

## Example response (`200`)

```json
{
  "status": 200,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "count": 1,
    "workflow_sessions": [
      {
        "slug": "sess01Ab",
        "entry_node_key": "job_application",
        "subject_row": {
          "slug": "row01Abc",
          "form_slug": "YWQOgWLp"
        },
        "event_count": 4,
        "created_at": "2026-11-05T18:00:00Z",
        "updated_at": "2026-11-05T18:10:00Z"
      }
    ]
  }
}
```

`subject_row` is the row that opened the session. `event_count` is the number of recorded steps. Retrieve `GET /workflows/{slug}/sessions/{session_slug}/` for the linked rows and the event log.

This request does not create a session and does not read form rows beyond the slugs needed to identify the run.
