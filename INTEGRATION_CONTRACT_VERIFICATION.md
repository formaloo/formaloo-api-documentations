# Integration mapping contract verification

The six schemas in `spec/integration-mapping-schemas.json` were extracted from
the real formz_core `/docs/openapi/yaml/?version=3.0` response in Docker, with
local component references expanded. They are not inferred from dashboard
TypeScript types. Source implementation: formz_core PR #548,
`formz/rest/serializers/v5/integration_mappings.py`, its owning serializers,
and the provider delivery handlers.

The snapshot is a release-pinned fallback for upstream schema publication lag.
Deploy the corresponding backend fixes before publishing consumers that depend
on NetSuite choice overrides or the stricter Mailchimp email descriptor.
`generate.sh` applies and validates the snapshot in both public and MCP outputs.

## Verification commands

After generating the docs, run `npm run validate:integration-mappings`.
For independent source verification, supply the JSON or YAML saved from the
backend schema endpoint, not another normalized docs artifact:

```sh
node scripts/validate-integration-mappings.mjs /path/to/backend-openapi.yaml
node scripts/validate-integration-mappings.mjs \
  ../FormalooMCPserver/src/openapi.json ../FormalooMCPserver/src/openapi.mcp.json
```

The check expands local schema references and compares all six definitions,
including provider type enums, nullability, required fields, supported groups,
and nested NetSuite string-value mappings. It also checks the Mailchimp PATCH
body and mapping requirements when that operation is present.
Backend changes require refreshing and rechecking the snapshot; comparing two
generated consumers alone is not independent evidence of backend correctness.

## Behavioral evidence and limits

Backend regression coverage exercises real authenticated create/PATCH/readback
operations for cross-form field rejection, Mailchimp replacement requirements,
NetSuite nested validation and choice-value conversion, and emitted OpenAPI.
The integration suite (186 tests) and field suite (332 tests) pass in isolated
Docker databases with pinned submodules. NetSuite tests cover select IDs,
partial/blank override fallback, untitled/deleted choices, and boolean conversion.

MCP integration evals cover all 22 catalog entries, connection/setup decisions,
discovery operations and provider-specific guidance. Loopback HTTP tests exercise
all six mapping providers against both pinned contracts: invalid shapes fail
before HTTP, and valid create/PATCH payloads preserve their mapping data.
These are deterministic
code/contract tests, not statistical language-model evals or evidence of live
provider delivery. Saved field ownership, provider metadata, OAuth permissions,
and third-party availability still require runtime checks and post-write
readback. No live provider-account mutation was used for this verification.

The repository-wide migration dry-run reports existing workflow/version index
name drift, reproduced without the changed worktree. These integration changes
add no model fields or migrations.
