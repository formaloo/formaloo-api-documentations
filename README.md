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
- `openapi-v3.0.mcp.yaml`: MCP-focused OpenAPI artifact with optional exclusions
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

Use `spec/mcp-openapi-settings.json` when you need a reduced OpenAPI artifact for MCP:

```json
{
  "exclude": {
    "services": ["authentication"],
    "pathPrefixes": ["/integrations/"],
    "pathPatterns": ["/*-integrations/"],
    "endpoints": ["/forms/{form_slug}/hubspot-integrations/"]
  }
}
```

- `services`: excludes operations by service tag (slug or display name, case-insensitive)
- `pathPrefixes`: excludes all methods for any path under matching prefixes
- `pathPatterns`: wildcard excludes (`*` supported), for example `/*-integrations/`
- `endpoints`: excludes all methods for exact endpoint paths

You can override the settings file location with:

```bash
MCP_OPENAPI_SETTINGS_FILE=spec/mcp-openapi-settings.json ./generate.sh
```

## Contributing

Documentation consists of automated OpenAPI specs from services, a public normalization step, and manual descriptions added in this repository.

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
