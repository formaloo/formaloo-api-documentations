## Re-run an AI Analysis field

`POST /v5/rows/{row_slug}/ai-box/{field_slug}/regenerate/`

Re-run one AI Analysis (`ai_box`) field on a saved row. The call runs that field only. Other AI Analysis fields on the same row stay as they are.

The run happens inside the request. A slow prompt returns `in_progress` and finishes later. A fast edit-mode prompt can return `completed` in this response.

### Path parameters

- `row_slug` — slug of the saved row.
- `field_slug` — slug of an `ai_box` field on that row's form.

### Request body

None.

### Response

`201 Created`

```json
{
  "data": {
    "ai_box": {
      "status": "in_progress"
    }
  }
}
```

`status` is one of `in_progress`, `completed`, or `failed`.

While the run is `in_progress`, the field's cell on the row is `Generating...`. The finished cell is the generated result, or `Failed to generate` when the run fails.

### Access control

The caller must be authenticated, belong to the workspace, and be allowed to edit the form. AI Analysis fields are admin-only.

### Error responses

- `400 Bad Request` — `This field is not an AI box on this row.`
- `400 Bad Request` — `This AI box has no prompt to run.`
- `400 Bad Request` — `AI features are turned off for this workspace.`
- `400 Bad Request` — `AI Box fields are available on premium fields plans only.`
- `400 Bad Request` — `This AI box is already running. You can't run it again right now.`
- `401 Unauthorized` — the caller is not authenticated.
- `403 Forbidden` — the caller cannot edit the form.
- `404 Not Found` — `row_slug` does not match a row.

A run still marked in progress after the workspace AI box wait timeout is treated as abandoned. A new regenerate is then allowed.
