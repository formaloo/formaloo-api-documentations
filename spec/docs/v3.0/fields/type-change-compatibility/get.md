# Field type change compatibility

`GET …/fields/type-change-compatibility/`

## Purpose

Read-only lookup against the server’s field-type conversion matrix. Call this before the type-change endpoint to see whether a conversion is allowed, which strategies apply, and whether row migration will run asynchronously.

## Query parameters

| Parameter      | Required | Description |
|----------------|----------|-------------|
| `source`       | Yes      | Current field type (e.g. `short_text`, `choice`, `profile`). Must be a known type other than `generic_field`. |
| `destination`  | No       | Target field type. If omitted, the response lists **every** valid destination type with its matrix entry. |

## Response (`data`)

- **With `destination`:** a single object with `compatibility`, `allow_keep_old_data`, `allow_remove_old_data`, and `async_required`.
- **Without `destination`:** a map `{ "<destination_type>": { …same keys… }, … }` for all destination types.

## Semantics

- **`compatibility`** — How well the pair matches (e.g. fully compatible vs soft / conditional).
- **`allow_keep_old_data` / `allow_remove_old_data`** — Which `change_strategy` values the type-change API accepts for that pair.
- **`async_required`** — Whether a **keep-data** conversion needs background row work; clients can drive UX from this alone (e.g. “may take a moment”).

Responses may be cached per user; repeat calls are inexpensive.

## Errors

`400` if `source` is missing or invalid, or if `destination` is present but invalid.

## Auth

Same as other admin field endpoints (authenticated user, application access, business context).

The concrete path prefix depends on your deployment (e.g. `/api/v5/…` or a versioned alias such as `/v3.0/…`).
