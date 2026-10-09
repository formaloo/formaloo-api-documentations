# Create an AI Analysis field

An AI Analysis field runs a custom prompt after a row is submitted. A form editor can also re-run one field on a saved row with `POST /v5/rows/{row_slug}/ai-box/{field_slug}/regenerate/`. Update logic can re-run one field with the `run_ai_box` action. Its result is stored on that row and is visible to form administrators, not respondents. AI Analysis is a premium field; the API rejects creation when the workspace does not have premium-field access.

The backend always saves this field as `admin_only: true` and `required: false`. Put the instruction sent to AI inside the field description's `{% block AI %}` block. Prompt placeholders can reference submission fields by slug or alias.

AI Analysis supports two modes:

- `analyze` is the default. AI generates HTML/text for the AI Analysis cell only.
- `edit` generates the AI Analysis cell and may update selected fields on the same submitted row. Set `editable_fields` to the slugs of fields AI may update.

Edit targets must belong to the same form. Supported targets are text, number, rating, hidden, date/time, variable, checkbox, yes/no, choice, dropdown, multiple-select, and assignee fields. Read-only, relation, file, product, matrix, table, and repeating-section fields cannot be targets.

`analyze_files` defaults to `false`. Set it to `true` to run this field with the file-analysis prompt, which can read files uploaded on the row. The workspace must have the AI File Analysis add-on. Without it, the API rejects the request with `File analysis for AI box fields requires the AI File Analysis add-on.` A field already saved as `true` keeps that value if the add-on is later removed, and its runs use the normal prompt for its mode until the add-on is present again. Fast edit mode always uses the fast-edit prompt.

## Analyze mode example

```json
{
  "form": "kTX4WMpC",
  "type": "ai_box",
  "title": "Application summary",
  "mode": "analyze",
  "description": "{% block AI %}Summarize this application using @resume and @experience.{% endblock %}"
}
```

## Edit mode example

Create the target fields first and use their returned slugs:

```json
{
  "form": "kTX4WMpC",
  "type": "ai_box",
  "title": "Application evaluator",
  "mode": "edit",
  "editable_fields": [
    "status_field_slug",
    "score_field_slug",
    "assignee_field_slug"
  ],
  "description": "{% block AI %}Evaluate @resume and @experience. Approve candidates who meet the stated criteria, assign a score, and select an assessor.{% endblock %}"
}
```

At submission time, the AI service receives the prompt plus form metadata for the permitted targets. Choice-like target metadata includes valid choice slugs. The AI response is validated against the configured targets before the row is changed. Invalid field slugs or values fail the AI edit instead of updating unconfigured fields.

The edit is asynchronous. While generation is pending, the AI Analysis cell contains `Generating...`. A successful result updates the AI cell and selected fields through the normal row-update path, so the form's update logic and update actions run afterward. A failed or timed-out generation sets the AI Analysis cell to `Failed to generate`.