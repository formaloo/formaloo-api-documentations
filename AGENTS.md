# Working in this repository

Guidance for humans and coding agents. This is the only such file — `CLAUDE.md`
is a symlink to it. Add a symlink for any other tool rather than a second copy.

## What this repository is

A **generator**, not a source of truth. It fetches OpenAPI specs from the
running services, filters and enriches them, and publishes two artifacts:

| Artifact | Consumers |
| --- | --- |
| `openapi-v3.0.yaml` | the public HTML reference, and general API clients |
| `openapi-v3.0.mcp.yaml` | the MCP-oriented contract, pinned by FormalooMCP |

Schemas originate in the backend serializers (`formaloo/formz_core`, via
drf-spectacular). **When a schema is wrong, fix it there.** Enrich here only
what the backend cannot reasonably express.

## Branches and environments

| Branch | Backend | Publishes to | Cloudflare project |
| --- | --- | --- | --- |
| `dev` | `api.staging.formaloo.com` | `docs.staging.formaloo.com` | `CLOUDFLARE_PROJECT_NAME_DEV` |
| `master` | `api.formaloo.me` | `docs.formaloo.com` | `CLOUDFLARE_PROJECT_NAME` |

`.github/workflows/deploy.yml` derives this from `DEPLOY_BRANCH`; `dev` sets
`STAGING_DOCS=true`, which is what selects the staging backend in
`generate.sh`. The two axes are coupled deliberately — there is no
"dev branch against prod backend" configuration.

## Contributing

**Base every PR on `dev` and merge it into `dev`.** That publishes staging docs.

**`dev` → `master` is the production publish.** It is a separate, deliberate
merge, not something a feature PR does. Treat it as a release: know what is in
it. Never target `master` directly.

Do not let `dev` sit far ahead of `master`. Unmerged work is invisible to
everyone consuming production docs, and downstream repositories pin the
*published* contract — not what is on `dev`. In September 2026 the integration
contract work sat on `dev` for twelve days; FormalooMCP's nightly sync failed
every one of those nights because the contract it needed had been written but
never published.

## Where to make a change

| You want to change | Edit |
| --- | --- |
| Endpoint prose, examples, guides | `spec/docs/v3.0/<path>/<method>.md` |
| A schema the backend under-specifies | `scripts/normalize-openapi.mjs` |
| Which operations reach the MCP artifact | `spec/mcp-openapi-settings.json` |
| An operation missing from the `mcp-1.0` contract | `requiredOperationIds` in `scripts/backfill-mcp-operations.mjs` |
| Required-operation guarantees | the lists in `scripts/validate-mcp-openapi.mjs` |
| Tag names, ordering, descriptions | `spec/tag-metadata.json` |
| A wrong or missing schema | **`formz_core` serializers**, not this repo |

Markdown under `spec/docs/` attaches by convention: `prepare-doc-stubs.mjs`
scans the fetched specs for `docs/...md` references and creates any stub that
does not exist yet.

`normalize-openapi.mjs` already hand-authors ~28 `Formaloo*` schemas. Follow
that naming and put new ones beside them. Keep the enrichment **additive** —
see the trap below.

The backfill list and the `validate-mcp-openapi.mjs` required lists must stay
in sync; the backfill script says so in a comment, and nothing enforces it.

## The build

`./generate.sh` runs the whole pipeline:

```
fetch-specs → strip-put-operations → prepare-doc-stubs → redocly bundle
  → openapi-merge (public) → normalize-openapi → redocly bundle → openapi-v3.0.yaml
  → openapi-merge (mcp) → backfill-mcp-operations → normalize-openapi
      → build-mcp-openapi (applies the exclusion filter)
      → prune-unused-mcp-schemas → validate-mcp-openapi → openapi-v3.0.mcp.yaml
```

Generated artifacts are gitignored (`openapi-v*`, `html/`, `artifacts/`,
`spec/formz*` and the other fetched specs). This repository cuts **no
releases**. Both facts matter: there is no committed copy of a published spec
to read, and no release asset to link to. To inspect what a build produced,
download the workflow run's artifact.

## Downstream

FormalooMCP pins both artifacts and validates them against its own operation
policy. A deploy dispatches `api-spec-updated` to it, carrying `environment`:

- `master` → `prod` — FormalooMCP resyncs its pinned specs and opens a PR
- `dev` → `staging` — FormalooMCP validates the contract, changing no pin

The staging dispatch exists so a contract that would break downstream is caught
before it is promoted, while fixing it here is still cheap.

Requires `MCP_DISPATCH_TOKEN`; the step is skipped without it. `GITHUB_TOKEN`
cannot dispatch across repositories.

Renaming an `operationId` is a breaking change for downstream pins even when
the path is untouched. Callers key off the id.

## Traps

**Do not overwrite what the backend already types.** `enrichIntegrationSchemas`
once assigned a generic `FormalooIntegrationMappedFields` to every
`mapped_fields` property, replacing the per-provider typed schemas the backend
emits. Guard enrichment on the property actually being untyped.

**Do not blanket-rewrite descriptions.** A downstream sync overlay rewrote every
`form_type` description to one generic string, destroying the deprecation
guidance authored here that steers callers from form-level `form_type` to
`theme.form_type`. Per-schema wording is deliberate.

**`secrets` is not available to step-level `if`.** Surface a secret through job
`env` and test that instead, or the condition will not evaluate as intended.

**The MCP exclusion filter is broad.** `pathPatterns` entries like
`*integration*` match far more than they appear to — that one pattern alone
removed 37 operations. Check what a pattern actually excludes before adding one.
