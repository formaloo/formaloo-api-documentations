Creates a saved **Workflow solution container** for the active workspace (called business in API contracts).

A Workflow brings together a process, its context, and the Formaloo resources that implement the solution. For example: collect a lead through an incoming event or form submission, use logic to update another form, notify a team, and show progress in an app. Forms and apps are common participants, not a required pair. A Workflow can describe planned resources or adopt a solution that already exists.

The blueprint describes the process; `context` records why that process looks like this; bindings identify its actual artifacts. This saved artifact supports later management, agent continuation, and dashboard presentation where supported by the connected product version. Use returned links rather than inventing a dashboard route.

## When agents should save a Workflow

- When the user asks to build/save a Workflow, create or reuse the container as part of that request.
- When continuing a named Workflow, read and update the same solution and its bindings.
- In an agent builder, follow the builder's explicit persistence policy.
- For a connected solution without a save request, offer once: “Would you like me to save this solution as a Workflow so you can find and manage it later?” Continue authorized resource work while awaiting the optional choice; save after acceptance.
- Standalone form/app creation and small edits do not require a Workflow or a save question. A meaningful process, rather than a resource count, is the reason to offer one.

## Critical behavior

- Saving the container records the `context` handoff and relationships. Configure fields, logic, notifications, integrations, and triggers through their own endpoints; they remain the runtime executors.
- Membership does not move resources, grant access, or activate delivery. `status=live` is a descriptive label, not a deployment operation.
- `blueprint` is schema-validated and referentially validated before save. This does not verify live artifacts, permissions, provider readiness, or executed acceptance tests.
- Node `key` values are stable plan-local aliases, not Formaloo artifact slugs. After creating/adopting artifacts, save bindings (`node_key` → `artifact_slug`).
- The optional MCP `plan_formaloo_workflow` aid returns a separate temporary build-plan schema. It is not required to save/build a Workflow, and its plan blob is not this endpoint's blueprint.

## Request fields

- `title` (required): short workflow name
- `description` (optional): longer notes for people reading the workflow
- `goal` (optional): if omitted and `blueprint.goal` is set, goal is copied from the blueprint
- `context` (optional): handoff for a later editor. Omit it to store `{}`. See below.
- `status` (optional): `planning` | `draft` | `testing` | `live` | `archived` (default `planning`)
- `blueprint` (optional but recommended): the plan JSON described below

## Context

`context` is why the workflow looks like this. `goal` stays the one-paragraph requirement. The blueprint stays the map. `description` stays human-facing notes.

Send the whole document on every write. A later `PATCH` that includes `context` replaces the stored document. Omit `context` to leave it unchanged. `null` or `{}` clears it.

Keep the requests, decisions, constraints, and edit notes that still govern the current workflow. Preserve `decisions[].key` across edits. When the user reverses a decision, keep that key, set `status` to `superseded`, and put the old choice in `rejected`. Store the requirement, the choice, and the reason. Do not store chat transcripts, tool traces, credentials, or temporary authorization proofs.

Limits: `intent` and `change_notes` are 2000 characters; other strings are 500; each list holds 20 items; the validated document is at most 16 KB. `schema_version` must be `1.0`. Decision keys are unique. A document over the limit is rejected so the writer folds older requests into `intent`, `decisions`, and `constraints`.

```json
{
  "schema_version": "1.0",
  "intent": "Score a quiz and email people who pass.",
  "requests": [
    {
      "summary": "Email only high scorers.",
      "outcome": "Pass email sends when the score is at least 70."
    }
  ],
  "decisions": [
    {
      "key": "pass-threshold",
      "status": "active",
      "choice": "Pass at 70.",
      "because": "The user named 70 as the passing score.",
      "rejected": ["Pass at 50."]
    }
  ],
  "constraints": ["Keep node key quiz."],
  "open_questions": [],
  "change_notes": "Do not rename node keys. Bindings use them."
}
```

List responses omit `context`. `GET /workflows/{slug}/` returns it. Read it before changing a workflow, and write it back in the same request as the blueprint change. Workflow versions record context changes, and restore returns the context saved with that version.

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
- Nodes represent resources or process participants. Keep individual fields inside form specifications using `spec.inputs` / `spec.outputs`; current `spec` supports only these aliases and `notes`. Record unbuilt decisions in supported notes, not invented properties such as `spec.fields`.
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
      "context": {
        "schema_version": "1.0",
        "intent": "Score a quiz and email people who pass.",
        "decisions": []
      },
      "blueprint": { "...": "..." }
    }
  }
}
```

## Build or adopt a solution

After the save decision above, use this sequence. Resource creation may happen before or after saving the container; adopting an existing solution should reuse its resources.

1. `POST /workflows/` with a blueprint and `context`
2. Optional `GET /workflows/{slug}/graph/` for Mermaid visualization / user review
3. Optional `POST /workflows/{slug}/validate/` before large PATCH updates
4. Build Formaloo artifacts with form/email/PDF endpoints
5. `POST /workflows/{slug}/bindings/` to map each `node_key` → built `artifact_slug`
6. Iterate with `PATCH /workflows/{slug}/` on the same workflow, including a replaced `context` when the user changed a request or decision

For dry-run validation without saving, use `POST /workflows/{slug}/validate/` after the workflow exists.

## Entrypoints and continuation

An `external_trigger` can describe incoming webhook/event collection with an action such as `submit_form` or `update_row`. A form webhook normally delivers **outbound**. Configure inbound collection through a verified inbound contract or external receiver calling the supported submission/row API; adding a blueprint node does not provision a receiver. Use `via`, mappings, and notes to explain where behavior is implemented and record unsupported/manual setup in `gaps`.

For continuation, read the Workflow, its `context`, and its bindings, inspect relevant live artifacts, then update only the requested solution parts. Write `context` back in the same request when a user request changes a decision. Preserve decision keys the user did not reverse. Validate artifact type, workspace, and availability before relying on a binding. Preserve stable node keys and unrelated resource configuration. Keep credentials and temporary authorization proofs out of `context`.

If artifact creation succeeded but binding persistence failed, repair the binding to that artifact. If creation's outcome is unknown, inspect before retrying; blindly recreating can duplicate resources. A binding needs a real artifact slug, so record pre-creation failures and external/manual steps in supported notes rather than fabricated bindings.
