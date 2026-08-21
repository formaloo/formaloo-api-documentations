Returns a Mermaid flowchart derived from the workflow blueprint.

Use this when presenting the plan visually to a user or another agent (for example Markdown Mermaid rendering). The graph is generated from `nodes[].actions[]` and is **not** a separate stored source of truth — always regenerate after blueprint changes.

## Path params

- `slug`: workflow slug

## Example response (`200`)

```json
{
  "status": 200,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "graph": {
      "mermaid": "flowchart TD\n    quiz[\"Assessment\\n(form)\"]\n    pass_email[\"You passed\\n(email_template)\"]\n    quiz -->|submit: send_email| pass_email"
    }
  }
}
```

Nodes without a `to` target may appear as effect sinks. Empty blueprints return a placeholder empty-workflow node.
