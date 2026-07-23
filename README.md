# Formaloo API Documentation

Repository for generating the public Formaloo API reference from OpenAPI specifications across multiple services.

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
- `html/`: generated static docs bundle
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

The MCP artifact (`openapi-v3.0.mcp.yaml`) should stay accurate for direct API users and easy to use for MCP/CLI clients:

- Keep required API headers documented when the underlying API requires them. For example, `x-api-key` is required for direct Formaloo API calls and should remain visible in the spec.
- When a hosted MCP server or CLI has a configured Formaloo API key, the client should inject that configured value instead of asking the user or agent to provide `x-api-key` for each tool call.
- Describe product terminology in user-facing language first, then mention legacy API terms where needed. For example, use “workspace” first and explain that API paths may still use “business”.
- For high-value MCP operations, include clear summaries, examples, result paths, pagination notes, and `x-formaloo-mcp` metadata so agents can choose the right operation without guessing from raw operation IDs.
- Magic AI endpoints support Formaloo dashboard/product AI experiences. Document them where applicable, but curate MCP/CLI usage case by case. Prefer stable resource contracts such as forms, fields, themes, rows, form-display submission, and file/import flows unless a Magic endpoint has a clear integration value, such as Magic Import.

### Adding Manual Descriptions

Manual descriptions are stored as Markdown files matching the endpoint path and HTTP method. For example, the endpoint `PATCH /v3.0/forms/{slug}/` uses:

- `spec/docs/v3.0/forms/{slug}/patch.md`
- `spec/docs/v3.0/forms/{slug}/put.md` (if PUT is also supported)

To create local placeholder markdown files for missing endpoint docs, run:

```bash
npm run prepare-doc-stubs
```

`./generate.sh` also prepares these paths during the build, but it removes temporary stubs before exiting so the worktree stays clean.

### Version Introductions

The public reference uses `spec/docs/v3.0/intro.md` for onboarding and version guidance.
