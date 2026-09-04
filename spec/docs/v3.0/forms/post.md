# 📘 Formaloo Logic Documentation (for AI Agents)

## 1. Purpose

This document explains how Formaloo’s logic system works so AI agents can reliably generate logic JSON for forms. It covers the structure, actions, conditions, field types, and best practices needed to turn natural language requirements into executable Formaloo logic.

---

## Form create payload

Use this endpoint to create the form resource itself. Start with stable form-level fields, then add or update fields through field-specific endpoints when needed.

Common create fields include:

- `title`: form display name.
- `description`: form description.
- `address`: optional public address/slug-like identifier. If omitted, the API can generate one.
- `show_title`: whether the title is visible on the form.
- `button_text`, `success_message`, `error_message`: user-facing submit/result text.
- `category`, `tags`, `board`: organization fields by slug.
- `logic`: array of form logic rules. See the logic structure below.
- `run_field_logics_on_update`: whether field logic should also run on row update for changed fields.
- notification/template fields such as `admin_email_notif_template`, `user_email_notif_template`, `rows_pdf_template`, `admin_pdf_template`, and `user_pdf_template`.

Create the form first, then retrieve it before applying complex logic, field ordering, theme changes, or workspace-specific references so you can use exact returned slugs. Creating fields is usually more reliable through field-specific endpoints after the form exists, because create-form payload support can vary by field type.

---

## 2. Logic Structure

In form create/update payloads, the form's `logic` property is an array of logic items:

```json
{
  "logic": [
    {
      "type": "field",
      "identifier": "field_slug",
      "actions": []
    }
  ],
  "run_field_logics_on_update": true
}
```

Each logic item is a JSON object:

```json
{
  "type": "field | submit | update | schedule",
  "identifier": "field_slug_or_schedule_key",
  "actions": [
    {
      "action": "action_type",
      "args": [ ... ],
      "when": {
        "operation": "operation_type",
        "args": [ ... ]
      }
    }
  ]
}
```

* **type**: scope of the logic (`field` = reacts to a field’s value, `submit` = on submission, `update` = on row edit, `schedule` = when a `wait` comes due).
* **identifier**: required for `field` (the field slug) and `schedule` (the key a `wait` action targets). Omit for `submit` and `update`.
* **actions**: what happens if conditions are met.
* **when**: defines the condition(s).

---

## 3. Action Types

### Field Display / Flow

| Action                 | Description                          | Notes                                        |
| ---------------------- | ------------------------------------ | -------------------------------------------- |
| `show`                 | Display a hidden field               | 
| `hide`                 | Hide a visible field                 | Often used with `otherwise`                  |
| `jump`                 | Go to a different field (multi-step) | For `form_type: multi_step`                  |
| `jump_to_success_page` | Redirect to success page             | Works in all forms                           |
| `submit`               | Immediately submit                   | Ends form early                              |

### Value Manipulation

| Action     | Description            | Example                      |
| ---------- | ---------------------- | ---------------------------- |
| `set`      | Assign a value         | Mark status as `"approved"`  |
| `add`      | Add to variable        | Add 40 to `price`            |
| `subtract` | Subtract from variable | Apply discount               |
| `multiply` | Multiply variable      | Handle quantity × unit price |
| `divide`   | Divide variable        | Compute averages             |

### Workflow & Integrations

| Action          | Description               |
| --------------- | ------------------------- |
| `send_email`    | Send custom email         |
| `send_webhook`  | Trigger API webhook       |
| `send_whatsapp` | Send an approved WhatsApp template. Not allowed in `field` logic. Requires template, receiver, variables, and agent |
| `send_slack`    | Slack notification        |
| `generate_pdf`  | Generate documents        |
| `redirect`      | Send user to external URL |
| `set_related`   | Set related record data   |
| `wait`          | Schedule an `on schedule` follow-up on this row. Not allowed in `field` logic |

---

## 4. Conditions

Conditions are expressed in the `when` clause.

Allowed operation keys:

`equal`, `not_equal`, `gte`, `lte`, `gt`, `lt`, `is`, `is_not`, `on`, `not_on`, `before`, `after`, `before_or_on`, `after_or_on`, `is_answered`, `contains`, `not_contains`, `starts_with`, `ends_with`, `always`, `otherwise`, `smallest`, `greatest`, `has_changed_to`.

Compound grouping uses `and` or `or` with nested condition objects in `args`.

### Comparisons

```json
{"operation": "gt", "args": [field_ref, const]}
{"operation": "lte", "args": [field_ref, const]}
{"operation": "equal", "args": [field_ref, const]}
{"operation": "not_equal", "args": [field_ref, const]}
```

### Choice Checks

```json
{"operation": "is", "args": [field_ref, choice_ref]}
{"operation": "is_not", "args": [field_ref, choice_ref]}
```

### State Checks

```json
{"operation": "is_answered", "args": [field_ref]}
{"operation": "has_changed_to", "args": [field_ref, value_ref]}
```

### Logical Combinations

```json
{"operation": "and", "args": [cond1, cond2]}
{"operation": "or", "args": [cond1, cond2]}
{"operation": "always", "args": []}
{"operation": "otherwise", "args": []}
```

### Update logic

The `update` logic rules run on field edit/update flows and are ignored on form submission.

If the `run_field_logics_on_update` setting on the form is `true`, the `field` logic will be run on row update as well. But only for the fields that are being changed.

* So if `run_field_logics_on_update` is `false`, none if the `field` logic will be checked and applied on row update.
* If `run_field_logics_on_update` is `true`, the `field` logic will be checked and applied, but only for the fields that are being updated.

### Schedule logic

Scheduled follow-ups are configured in the same `logic` array. There is no separate scheduling endpoint.

A `wait` action on `submit`, `update`, or another `schedule` section binds a follow-up to the current row. When that time arrives, Formaloo re-evaluates the matching `type: "schedule"` section against the row as it stands then — not as it was when the wait was created.

A form may hold several schedule sections. Each `identifier` must be unique. Every `wait` must name an existing schedule identifier; otherwise the payload is rejected.

`wait` arguments, in order:

1. **Schedule key** — constant whose `value` is the `identifier` of the `schedule` section to run.
2. **Base** — `now`, `created_at`, `updated_at`, or a date/datetime field.
3. **Expression** — a relative date string. Offsets combine signed amounts with a unit: `min` (minutes), `h` (hours), `d` (days), `w` (weeks), `m` (months), `y` (years). Examples: `+30min`, `+2h +15min`, `+7d`, `-1w`, `+5m`. Note `m` is months, so minutes are spelled `min`. Keywords: `today`, `tomorrow`, `this_week`, `next_week`, `this_month`, `next_month`, `this_year`, `next_year`. Use `custom` with a fourth argument for an absolute datetime.
4. **Custom target** — only when the expression is `custom`. An ISO datetime string.

```json
{
  "action": "wait",
  "args": [
    {"type": "constant", "value": "approval_chase"},
    {"type": "constant", "value": "now"},
    {"type": "constant", "value": "+2d"}
  ],
  "when": {
    "operation": "is",
    "args": [
      {"type": "field", "value": "status_slug"},
      {"type": "choice", "value": "pending_choice_slug"}
    ]
  }
}
```

From a date or datetime field:

```json
{"type": "field", "identifier": "appointment_slug"}
```

A `custom` wait:

```json
{
  "action": "wait",
  "args": [
    {"type": "constant", "value": "reminder"},
    {"type": "constant", "value": "now"},
    {"type": "constant", "value": "custom"},
    {"type": "constant", "value": "2026-08-05T09:00:00Z"}
  ],
  "when": {"operation": "always", "args": []}
}
```

Resolution rules:

* Offset expressions keep the time of day of the base. A datetime field at `14:30` plus `+2d` runs at `14:30` two days later, and `+30min` runs at `15:00` the same day.
* A date-only field has no time of day, so it runs at `23:59:59` of the resolved day. Minute and hour offsets are measured from that instant.
* Keyword expressions (`tomorrow`, `next_month`, …) and `custom` are anchored on the current clock. Their base must be `now`. Keywords resolve to the end of that day in the workspace timezone.
* If the base field is empty or unparsable when the wait is saved, the follow-up is recorded as unresolved and never fires.
* `wait` cannot be used in `field` logic: field logic has no row to bind to.
* Conditions on a `wait` are evaluated when the wait is scheduled. If a submit payload omits the guarded field, `is` / `is_not` fail and no task is created. Put `when: always` on the submit `wait` and gate the email on the schedule section instead.

At fire time:

* Conditions on the schedule section run against current row data. If nothing matches, the step is skipped and any `wait` in that section is not scheduled.
* A matching `wait` inside a schedule section chains the next step. Removing or renaming a schedule `identifier` cancels pending follow-ups that targeted it. Sending `logic` still replaces the whole array.

Create the form and its fields first, then `PATCH /v3.0/forms/{slug}/` with the full `logic` array so `wait` and `schedule` identifiers can use returned field and choice slugs.

### WhatsApp send

`send_whatsapp` sends an approved WhatsApp template when a `submit`, `update`, or `schedule` section matches. It cannot be used in `field` logic: there is no stored row yet.

The workspace must have a ready WhatsApp Business connection. All four arguments are required, in this order:

1. **Template** — `whatsapp_template` whose `identifier` is the template ContentSid (`HX` followed by 32 hex characters). The template must already exist and be approved.
2. **Receiver** — a `whatsapp_receiver` identifying a phone or text field, or a `constant` E.164 number such as `+15551234567`.
3. **Variables** — `whatsapp_variables` whose `value` is an object of numbered keys (`"1"`, `"2"`, …). Each entry is a typed mapping: `constant`, `field`, or `variable`.
4. **Agent** — `agent` whose `identifier` is the Agent Builder agent that sends the message. A payload with only three arguments is rejected.

```json
{
  "action": "send_whatsapp",
  "args": [
    {"type": "whatsapp_template", "identifier": "HX0123456789abcdef0123456789abcdef"},
    {"type": "whatsapp_receiver", "identifier": "phone_slug"},
    {
      "type": "whatsapp_variables",
      "value": {
        "1": {"type": "field", "identifier": "name_slug"},
        "2": {"type": "constant", "value": "Acme"}
      }
    },
    {"type": "agent", "identifier": "agent-1"}
  ],
  "when": {"operation": "always", "args": []}
}
```

A constant receiver:

```json
{"type": "constant", "value": "+15551234567"}
```

Resolution rules:

* Field and variable mappings are resolved from the row at send time. Missing values become empty strings.
* The agent is validated against the workspace when the message is sent. An invalid agent skips the send; the row is left unchanged.
* `send_whatsapp` cannot be used in `field` logic.

---

## 5. Argument Types

* **Field Reference**:

  ```json
  {"type": "field", "value": "field_slug"}
  ```
* **Choice Reference**:

  ```json
  {"type": "choice", "value": "choice_slug"}
  ```
* **Variable Reference**:

  ```json
  {"type": "variable", "identifier": "variable_slug"}
  ```
* **Constant Value**:

  ```json
  {"type": "constant", "value": 100}
  ```
* **Matrix Reference**:

  ```json
  {"type": "matrix", "value": "matrix_slug.group_slug"}
  ```
* **Table Reference**:

  ```json
  {"type": "table", "value": "table_slug.row_slug.column_slug"}
  ```
* **Formula or Link Literal**:

  ```json
  {"type": "formula", "value": "CONCAT({first_name}, ' ', {last_name})"}
  {"type": "link", "value": "https://example.com/thanks"}
  ```
* **WhatsApp template, receiver, variables, and agent**:

  ```json
  {"type": "whatsapp_template", "identifier": "HX0123456789abcdef0123456789abcdef"}
  {"type": "whatsapp_receiver", "identifier": "phone_slug"}
  {
    "type": "whatsapp_variables",
    "value": {
      "1": {"type": "field", "identifier": "name_slug"}
    }
  }
  {"type": "agent", "identifier": "agent-1"}
  ```

---

## 6. Field Types and Logic Compatibility

* **Text (`short_text`, `long_text`)** → Compare values, check presence.
* **Number** → Supports all numeric comparisons & math.
* **Choice Fields (`dropdown`, `choice`, `multiple_select`)** → Use `is` / `is_not`.
* **Date/Time** → Compare values, schedule conditions.
* **Yes/No** → Boolean conditions.
* **Variable** → Store and calculate values.
* **File/Signature** → Check completion status.
* **Matrix/Repetition** → Use group references.
* **Meta (`page_break`, `section`)** → Structural only (not logic triggers).

---

## 7. Patterns & Examples

### Conditional Field Display

```json
{
  "type": "field",
  "identifier": "service_type",
  "actions": [
    {
      "action": "show",
      "args": [
        {"type": "field", "identifier": "website_type"}
      ],
      "when": {
        "operation": "is",
        "args": [
          {"type": "field", "value": "service_type"},
          {"type": "choice", "value": "E6Ogr88h"} // "Web design"
        ]
      }
    }
  ]
}
```

Note that when we conditionally show a field, it will be hidden by default. So we don't need an `otherwise` rule to hide it.

### Price Calculation

```json
{
  "type": "field",
  "identifier": "EtHFR2Ex", // product field
  "actions": [
    {
      "action": "add",
      "args": [
        {"type": "constant", "value": 40},
        {"type": "variable", "identifier": "price"}
      ],
      "when": {
        "operation": "is",
        "args": [
          {"type": "field", "value": "EtHFR2Ex"},
          {"type": "choice", "value": "p9olWZI2"} // "Added to cart"
        ]
      }
    }
  ]
}
```

### Multi-Condition Logic

```json
{
  "type": "field",
  "identifier": "budget",
  "actions": [
    {
      "action": "show",
      "args": [
        {"type": "field", "identifier": "discount_field"}
      ],
      "when": {
        "operation": "and",
        "args": [
          {
            "operation": "gt",
            "args": [
              {"type": "field", "value": "budget"},
              {"type": "constant", "value": 10000}
            ]
          },
          {
            "operation": "is",
            "args": [
              {"type": "field", "value": "urgency"},
              {"type": "choice", "value": "GtkSx1YW"} // "Start within 1–2 weeks"
            ]
          }
        ]
      }
    }
  ]
}
```

### Workflow on Submission

```json
{
  "type": "submit",
  "actions": [
    {
      "action": "send_email",
      "args": [
        {"type": "send_email_template", "identifier": "order_confirmation"},
        {"type": "field", "identifier": "email"}
      ],
      "when": {"operation": "always", "args": []}
    }
  ]
}
```

### WhatsApp on submission

```json
{
  "type": "submit",
  "actions": [
    {
      "action": "send_whatsapp",
      "args": [
        {"type": "whatsapp_template", "identifier": "HX0123456789abcdef0123456789abcdef"},
        {"type": "whatsapp_receiver", "identifier": "phone_slug"},
        {
          "type": "whatsapp_variables",
          "value": {
            "1": {"type": "field", "identifier": "name_slug"},
            "2": {"type": "constant", "value": "Acme"}
          }
        },
        {"type": "agent", "identifier": "agent-1"}
      ],
      "when": {"operation": "always", "args": []}
    }
  ]
}
```

Prefer `PATCH /v3.0/forms/{slug}/` for this payload after the form, phone field, and WhatsApp template exist.

### Scheduled follow-up on submission

Send a chase email two days after submit if the row is still pending. If it is still pending then, wait two more days and escalate.

```json
{
  "type": "submit",
  "actions": [
    {
      "action": "wait",
      "args": [
        {"type": "constant", "value": "approval_chase"},
        {"type": "constant", "value": "now"},
        {"type": "constant", "value": "+2d"}
      ],
      "when": {"operation": "always", "args": []}
    }
  ]
}
```

```json
{
  "type": "schedule",
  "identifier": "approval_chase",
  "actions": [
    {
      "action": "send_email",
      "args": [
        {"type": "send_email_template", "identifier": "chase_template_slug"},
        {"type": "field", "identifier": "email_slug"}
      ],
      "when": {
        "operation": "is",
        "args": [
          {"type": "field", "value": "status_slug"},
          {"type": "choice", "value": "pending_choice_slug"}
        ]
      }
    },
    {
      "action": "wait",
      "args": [
        {"type": "constant", "value": "approval_escalate"},
        {"type": "constant", "value": "now"},
        {"type": "constant", "value": "+2d"}
      ],
      "when": {
        "operation": "is",
        "args": [
          {"type": "field", "value": "status_slug"},
          {"type": "choice", "value": "pending_choice_slug"}
        ]
      }
    }
  ]
}
```

Both items belong in the same `logic` array, together with the `schedule` section whose `identifier` is `approval_escalate`. Prefer `PATCH /v3.0/forms/{slug}/` for this payload after the form and fields exist.

---

## 8. Best Practices

* Always reference exact **slugs** for fields and choices (from form JSON).
* Match operations to field types (e.g., `gt` works only with numbers).
* Use variables for all price, score, or computed values.
* Avoid circular logic (a field showing/hiding itself).
* Test with fallback conditions (`otherwise`) to ensure graceful behavior.
* Put every `schedule` section in the same `logic` array as the `wait` that targets it. Removing a schedule key cancels that follow-up.
* Do not put `wait` in `field` logic.
* Do not put `send_whatsapp` in `field` logic. Include all four arguments; the `agent` identifier is required.

---

## Example request: create a basic form

```json
{
  "title": "Customer Feedback",
  "description": "Tell us how we can improve.",
  "show_title": true,
  "button_text": "Submit",
  "success_message": "Thanks for your feedback.",
  "form_type": "simple"
}
```

## Example response (`201`)

```json
{
  "status": 201,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "form": {
      "slug": "kTX4WMpC",
      "address": "oukll",
      "title": "Customer Feedback",
      "show_title": true,
      "description": "Tell us how we can improve.",
      "success_message": "Thanks for your feedback.",
      "button_text": "Submit",
      "form_type": "simple",
      "fields": {},
      "submit_count": 0,
      "theme": null
    }
  }
}
```

Create fields next with `POST /v3.0/fields/` (or a per-type field endpoint), then retrieve the form with `GET /v3.0/forms/{slug}/` before attaching logic, themes, or boards.

## Example request: create a multi-step form

Set `form_type` to `multi_step`, then add page breaks with `meta` + `sub_type: page_break` fields after the form exists.

```json
{
  "title": "Onboarding Survey",
  "description": "A short multi-page onboarding form.",
  "form_type": "multi_step",
  "show_title": true,
  "button_text": "Continue"
}
```

After create, add fields in order and insert page breaks between steps:

```json
{
  "form": "kTX4WMpC",
  "title": "About you",
  "type": "meta",
  "sub_type": "page_break"
}
```

Use `jump` logic actions on multi-step forms to skip pages based on answers.
