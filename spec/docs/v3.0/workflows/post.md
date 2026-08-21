Creates a workflow that stores a **blueprint plan** for the active business.

Use this when an MCP client turns a user requirement into a durable Formaloo-aware plan that another agent (or a later session) can implement or iterate without the original chat history.

## Critical behavior

- The workflow is a **map only**. It does **not** execute runtime behavior.
- Form logic, form settings, webhooks, integrations, and schedules remain the executors.
- `blueprint` is schema-validated and referentially validated before save.
- Node `key` values are **plan-local aliases**, not Formaloo artifact slugs.
- After artifacts are built, record mappings with binding endpoints (`node_key` → `artifact_slug`).

## Request fields

- `title` (required): short workflow name
- `description` (optional): longer notes
- `goal` (optional): if omitted and `blueprint.goal` is set, goal is copied from the blueprint
- `status` (optional): `planning` | `draft` | `testing` | `live` | `archived` (default `planning`)
- `blueprint` (optional but recommended): the plan JSON described below

## Blueprint shape

```json
{
  "schema_version": "1.0",
  "goal": "verbatim user requirement",
  "summary": "what the built system does",
  "nodes": [],
  "access": [],
  "capabilities": [],
  "gaps": [],
  "tests": []
}
```

### Node

```json
{
  "type": "form",
  "key": "quiz",
  "title": "Assessment",
  "purpose": "Collects answers and computes a score.",
  "build": { "operation": "create" },
  "spec": {
    "inputs": ["email", "q1"],
    "outputs": ["score"],
    "notes": "score is a decimal variable, default 0"
  },
  "actions": []
}
```

- `type`: `form` | `page` | `email_template` | `pdf_template` | `webhook` | `external_trigger` | `app` | `theme` | `integration` | `schedule` | `manual_step`
- Smallest unit is a **form**. Do not model individual fields as nodes; put field aliases in `spec.inputs` / `spec.outputs`.
- `build.operation`: `create` | `adopt` | `update` | `no_op`
- `adopt` / `update` require `build.ref` (existing Formaloo artifact slug)

### Action (edge)

```json
{
  "on": "submit",
  "action": "send_email",
  "to": "pass_email",
  "via": "form_logic",
  "when": {
    "operation": "gte",
    "args": [
      { "type": "node_field", "value": "quiz.score" },
      { "type": "constant", "value": 70 }
    ]
  },
  "mapping": [
    {
      "target": "pass_email.recipient",
      "source": { "type": "node_field", "value": "quiz.email" }
    }
  ],
  "args": []
}
```

- `on`: `submit` | `update` | `field_change` | `payment_received` | `webhook_received` | `schedule` | `manual`
- `action`: `submit_form` | `update_row` | `send_email` | `generate_pdf` | `send_webhook` | `call_integration` | `assign` | `set_status` | `set_value` | `score` | `show_page` | `redirect` | `display_data`
- `to`: target node key (required for connecting actions such as `send_email`, `submit_form`, `generate_pdf`)
- `via`: where runtime implements it — `form_logic` | `form_settings` | `webhook` | `integration` | `schedule` | `manual`
- `when`: same condition grammar as form logic (`equal`, `gte`, `is`, `and`, `or`, `always`, …)
- Argument types: `node_field` (`node.field_alias`), `choice` (`node.field.choice`), `node`, `constant`, `role`

### Access / capabilities / gaps / tests

- `access`: `{ "role", "node", "scope" }` (e.g. requester / own)
- `capabilities`: paid or gated features the plan needs
- `gaps`: Formaloo limitations plus workarounds (important for honest plans)
- `tests`: `{ "key", "input", "expect": [{ "node", "action", "occurs" }] }`

## Example request

```json
{
  "title": "Scored quiz with pass email",
  "blueprint": {
    "schema_version": "1.0",
    "goal": "A quiz that scores answers and emails high scorers.",
    "summary": "Collect answers, compute score, email passers.",
    "nodes": [
      {
        "type": "form",
        "key": "quiz",
        "title": "Assessment",
        "purpose": "Collects answers and computes a score.",
        "build": { "operation": "create" },
        "spec": {
          "inputs": ["email", "q1"],
          "outputs": ["score"]
        },
        "actions": [
          {
            "on": "submit",
            "action": "send_email",
            "to": "pass_email",
            "via": "form_logic",
            "when": {
              "operation": "gte",
              "args": [
                { "type": "node_field", "value": "quiz.score" },
                { "type": "constant", "value": 70 }
              ]
            },
            "mapping": [
              {
                "target": "pass_email.recipient",
                "source": { "type": "node_field", "value": "quiz.email" }
              }
            ]
          }
        ]
      },
      {
        "type": "email_template",
        "key": "pass_email",
        "title": "You passed",
        "purpose": "Confirms the result and pipes the score.",
        "build": { "operation": "create" },
        "spec": { "inputs": ["recipient", "score"], "outputs": [] },
        "actions": []
      }
    ],
    "access": [],
    "capabilities": [],
    "gaps": [],
    "tests": [
      {
        "key": "passing",
        "input": { "quiz.q1": "correct", "quiz.email": "a@b.com" },
        "expect": [
          { "node": "pass_email", "action": "send_email", "occurs": true }
        ]
      }
    ]
  }
}
```

## Example response (`201`)

```json
{
  "status": 201,
  "errors": { "general_errors": [], "form_errors": {} },
  "data": {
    "workflow": {
      "slug": "aBc123Xy",
      "title": "Scored quiz with pass email",
      "status": "planning",
      "goal": "A quiz that scores answers and emails high scorers.",
      "blueprint": { "...": "..." }
    }
  }
}
```

## Recommended MCP flow

1. `POST /workflows/` with a blueprint
2. Optional `GET /workflows/{slug}/graph/` for Mermaid visualization / user review
3. Optional `POST /workflows/{slug}/validate/` before large PATCH updates
4. Build Formaloo artifacts with form/email/PDF endpoints
5. `POST /workflows/{slug}/bindings/` to map each `node_key` → built `artifact_slug`
6. Iterate with `PATCH /workflows/{slug}/` on the same workflow

For dry-run validation without saving, use `POST /workflows/{slug}/validate/` after the workflow exists.
