Retrieves one workflow session, its linked rows, and its event log.

Use this after the session list when you need the steps of one run: the opening submit, later updates, rows added by logic, and each email, webhook, PDF, Slack, and WhatsApp action already recorded.

## Access

The profile that created the workflow, and owners and admins of the workspace, can read the session. A workspace member who did not create the workflow receives `403`. A session slug from another workflow receives `404`.

## Path params

- `slug`: workflow slug
- `session_slug`: session slug from the session list

## Example response (`200`)

```json
{
  "status": 200,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "workflow_session": {
      "slug": "sess01Ab",
      "entry_node_key": "job_application",
      "subject_row": {
        "slug": "row01Abc",
        "form_slug": "YWQOgWLp"
      },
      "event_count": 2,
      "linked_rows": [
        {
          "slug": "row01Abc",
          "form_slug": "YWQOgWLp",
          "node_key": "job_application",
          "created_at": "2026-11-05T18:00:00Z"
        }
      ],
      "events": [
        {
          "kind": "row_submitted",
          "node_key": "job_application",
          "row_slug": "row01Abc",
          "artifact_type": "form",
          "artifact_slug": "YWQOgWLp",
          "created_at": "2026-11-05T18:00:00Z"
        },
        {
          "kind": "send_email",
          "node_key": "job_application",
          "row_slug": "row01Abc",
          "artifact_type": "email_template",
          "artifact_slug": "AdcUq0v8",
          "created_at": "2026-11-05T18:00:02Z"
        }
      ],
      "created_at": "2026-11-05T18:00:00Z",
      "updated_at": "2026-11-05T18:00:02Z"
    }
  }
}
```

`linked_rows` includes the opening row and rows attached later. `events` is oldest first. `artifact_slug` points at the form, template, webhook, generated PDF, or integration recorded for that step. `row_slug` is null when the step has no row.

This request does not change the session.
