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
  "type": "field | submit | update",
  "identifier": "field_slug",
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

* **type**: scope of the logic (`field` = reacts to a field’s value, `submit` = on submission, `update` = variable manipulation).
* **identifier**: the field slug this logic is tied to.
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

| Action         | Description               |
| -------------- | ------------------------- |
| `send_email`   | Send custom email         |
| `send_webhook` | Trigger API webhook       |
| `send_slack`   | Slack notification        |
| `generate_pdf` | Generate documents        |
| `redirect`     | Send user to external URL |
| `set_related`  | Set related record data   |

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

---

## 8. Best Practices

* Always reference exact **slugs** for fields and choices (from form JSON).
* Match operations to field types (e.g., `gt` works only with numbers).
* Use variables for all price, score, or computed values.
* Avoid circular logic (a field showing/hiding itself).
* Test with fallback conditions (`otherwise`) to ensure graceful behavior.
