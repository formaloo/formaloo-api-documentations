# Formaloo API Documentation

Repository for generating Formaloo API documentation from OpenAPI specifications across multiple services.

## Running the Service

Build and generate documentation:

```bash
docker compose up
```

The generated HTML files are available in the `html` directory. Serve them locally:

```bash
cd html && python3 -m http.server 8000
```

### Environment Configuration

Use `STAGING_DOCS=true` to generate documentation from staging endpoints:

```bash
STAGING_DOCS=true docker compose up
```

- **Production** (default): Uses `api.formaloo.me` and related production endpoints
- **Staging**: Uses `api.staging.formaloo.com` and related staging endpoints

## Contributing

Documentation consists of automated OpenAPI specs from services and manual descriptions added in this repository.

### Adding Manual Descriptions

Manual descriptions are stored as Markdown files matching the endpoint path and HTTP method. For example, the endpoint `PATCH /v2.0/forms/{slug}/` uses:

- `spec/docs/v2.0/forms/{slug}/patch.md`
- `spec/docs/v2.0/forms/{slug}/put.md` (if PUT is also supported)

Run `docker compose up` to automatically create missing documentation file structure, then edit the generated files.

### Version Introductions

Each API version has an introduction file (e.g., `spec/docs/v2.0/intro.md`) containing version overview, getting started guide, and general considerations.
