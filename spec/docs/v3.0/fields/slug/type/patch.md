# Field type change

`PATCH …/fields/<slug>/type/`

## Purpose

Change an existing field’s **type** by `slug`. This endpoint accepts only type-change fields; do not send general edit payloads (title, position, etc.) here.

## Request body (JSON)

| Field              | Required | Description |
|--------------------|----------|-------------|
| `type`             | Yes      | Destination field type (`FieldType`). Must not be `generic_field`. |
| `change_strategy`  | No       | `keep_old_data` or `remove_old_data`. If omitted, the service applies its default for the pair. |

No other keys are allowed.

## Behavior

- Validates the pair and strategy against the same matrix as the compatibility endpoint.
- Archives the old field record, creates the new subtype, migrates relations and dependencies, and schedules row migration when required.
- The new field **reuses the original slug** so slug-based references (logic, blocks, etc.) stay valid.

## Response

The usual field representation for the new field, plus a `type_change` object:

`source_type`, `destination_type`, `strategy`, `compatibility`, `async_required`, `status`, `message`.

Use `status` and `async_required` to distinguish synchronous completion from pending async work.

## Errors

`400` for validation failures: unknown type, disallowed strategy, same type as current, unexpected keys, or conversion rules. Some conversion errors are returned as validation errors on `type`.

## Auth

Same as other admin field actions (authenticated user, application access, business context).

The concrete path prefix depends on your deployment (e.g. `/api/v5/…` or a versioned alias such as `/v3.0/…`).
