Dry-runs blueprint validation for an existing workflow without saving. Use this when an agent wants hard confirmation that a proposed plan is schema-valid and referentially consistent before applying it with PATCH.

Send `{ "blueprint": { ... } }`. The response reports `valid` and a list of `errors` when validation fails.
