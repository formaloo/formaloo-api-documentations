# Formaloo API Documentation

Repository for generating the public Formaloo API reference from OpenAPI specifications across multiple services.

Contributing, branch model, and the production publish are documented in [AGENTS.md](AGENTS.md).

## Running the Service

Install the pinned tooling:

```bash
npm ci
```

Generate the public spec, validation reports, and HTML docs:

```bash
./generate.sh
```

You can still run the full build in Docker:

```bash
docker compose up --build
```

Generated outputs:

- `openapi-v3.0.yaml`: canonical public OpenAPI artifact
- `openapi-v3.0.mcp.yaml`: MCP-focused OpenAPI artifact
- `html/`: static API reference. The page is the pinned open-source Scalar renderer (`@scalar/api-reference`) loading `openapi-v3.0.yaml`. Redocly CLI still bundles and lints the spec.
- `artifacts/validation/`: validation and lint reports
- `artifacts/release/`: packaged release assets

Optional generation metadata:

- `spec/operation-metadata.json`: optional sidecar manifest for public-safe operation metadata. The pipeline succeeds when this file is absent.
- `spec/tag-metadata.json`: public-facing tag naming and description overrides for generated docs navigation.

Serve the generated docs locally:

```bash
cd html && python3 -m http.server 8000
```

### Environment Configuration

Use `STAGING_DOCS=true` to generate documentation from staging endpoints:

```bash
STAGING_DOCS=true ./generate.sh
```

- **Production** (default): Uses `api.formaloo.me` and related production endpoints
- **Staging**: Uses `api.staging.formaloo.com` and related staging endpoints

## Contributing

Documentation consists of automated OpenAPI specs from services, a public normalization step, and manual descriptions added in this repository.

### Branch and Deployment Flow

This repository uses both `dev` and `master` in the documentation release flow:

- `dev` is the staging documentation branch.
- `master` is the production documentation branch.
- Changes may be merged between `dev` and `master` as part of promotion or backfill work.

Target `dev` first for new documentation or generated-spec improvements unless the change is explicitly production-only. Check both branches before repeating work, because staging may contain changes that are not yet in production.

### MCP-Focused OpenAPI Guidance

The MCP artifact (`openapi-v3.0.mcp.yaml`) is built from the formz service contract fetched with `?version=mcp-1.0`, merged with the other services (which stay on `?version=3.0`). The public artifact (`openapi-v3.0.yaml`) continues to use the formz `?version=3.0` contract.

While the upstream `mcp-1.0` contract is being rolled out, `scripts/backfill-mcp-operations.mjs` copies validator-required operations that are missing from the `mcp-1.0` merge (for example `formsRetrieve`, `formsPartialUpdate`, `formsDestroy`, `fieldsCreate`, `fieldsRetrieve`, `fieldsDestroy`, `fieldsPartialUpdate`) from the formz v3.0 bundle and logs each backfilled operation. The step is a no-op once the upstream contract exposes them; remove the script when the rollout is complete.

The MCP artifact should stay accurate for direct API users and easy to use for MCP/CLI clients:

- Keep required API headers documented when the underlying API requires them. For example, `x-api-key` is required for direct Formaloo API calls and should remain visible in the spec.
- Header requirements follow one rule in the MCP artifact: `x-api-key` is required on every operation, and `x-workspace` and `Authorization` are required on every operation that documents them. An operation that does not need a workspace or a token omits the header instead of marking it optional. `scripts/build-mcp-openapi.mjs` enforces this and `scripts/validate-mcp-openapi.mjs` fails the build when an operation drifts.
- Successful deletes answer with `200`, not `204`. The MCP build rewrites the generated `204` responses and the validator rejects any `DELETE` operation that lacks `200` or still declares `204`. The public `openapi-v3.0.yaml` artifact still mirrors the upstream `204` because it is not rewritten.
- Successful JSON responses in the MCP artifact are modeled as the Formaloo wire envelope: `{ status, errors, data }`. The operation-specific success payload is the schema of `data`, response examples are wrapped the same way, and `x-formaloo-response-envelope` records the paths MCP/CLI clients should read. The public `openapi-v3.0.yaml` artifact should move to backend-owned envelope schemas separately when the formz source contract is updated.
- When a hosted MCP server or CLI has a configured Formaloo API key, the client should inject that configured value instead of asking the user or agent to provide `x-api-key` for each tool call.
- Describe product terminology in user-facing language first, then mention legacy API terms where needed. For example, use “workspace” first and explain that API paths may still use “business”.
- For high-value MCP operations, include clear summaries, examples, result paths, pagination notes, and `x-formaloo-mcp` metadata so agents can choose the right operation without guessing from raw operation IDs.
- Magic AI endpoints support Formaloo dashboard/product AI experiences. Document them where applicable, but curate MCP/CLI usage case by case. Prefer stable resource contracts such as forms, fields, themes, rows, form-display submission, and file/import flows unless a Magic endpoint has a clear integration value, such as Magic Import.

### Operation Descriptions

Operation descriptions come from the source services, not from this repository. Each service sets them with drf-spectacular `extend_schema(description=...)` on the endpoint: inline for short text, or `api_doc('<path>/<method>.md')` for a Markdown file under that service's `docs/api/v3.0/`. This repository does not store or inject descriptions; to add or fix one, change the owning service.

#### What to include

Write what a caller needs to use the endpoint correctly, not a restatement of the schema. Typical contents:

- **What it does.** One or two sentences in product language. Mention UI names when they differ from API names (for example, a board is an app in the Formaloo UI).
- **Considerations.** Defaults, side effects, destructive or irreversible behavior, flags that change scope, confirmation requirements, related endpoints to prefer instead, and async or lifecycle notes when the `200` does not mean the work is finished.
- **Request and response examples.** Short, realistic JSON (or HTTP) snippets for the non-obvious cases: a success body, a notable error, or a request that shows a flag or payload shape the schema does not make obvious.

#### What not to include

Do not duplicate the auto-generated OpenAPI contract. Leave these out of the Markdown file:

- Lists of fields with descriptions, types, required/optional, or enums
- Request or response structure, schema trees, or parameter tables
- Auth headers, path parameters, query parameter inventories, or status-code catalogs that already appear on the operation
- Exhaustive copies of resource objects

A snippet that shows a payload shape is fine. A field-by-field spec is not. If the generated schema is wrong, fix it in the source service contract.

### Version Introductions

The public reference uses `spec/docs/v3.0/intro.md` for onboarding and version guidance.
