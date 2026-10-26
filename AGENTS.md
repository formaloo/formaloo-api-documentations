# Working in this repository

`CLAUDE.md` is a symlink to this file. Add symlinks for other tools, not copies.

This repository generates the published API contract; it does not own it.
Schemas come from each backend service's generated OpenAPI (sources in
`scripts/fetch-specs.mjs`); the bulk is formz, from `formaloo/formz_core`
(drf-spectacular). **Fix a wrong schema in the backend.** Enrich here only what
the backend cannot express.

## API documentation

Apply this checklist when adding a new API or updating an existing API,
including legacy endpoints. Complete documentation for the affected operations
in the same PR.
Write for all API consumers, including humans, SDKs and MCP agents.

- Check new and updated operations against their source implementation. Include a concise
  summary, useful descriptions and readable titles where technical names are unclear.
- Keep types, required fields, defaults, enums and limits in schemas. Use prose
  for meaning, identifiers, prerequisites, permissions, side effects and conditions
  the schema cannot express. Cover errors, pagination and asynchronous completion
  where applicable. Use synthetic examples for complex inputs or workflows.
- Keep each fact in one source. Public and MCP artifacts should reuse API
  explanations. MCP owns tool discovery and workflow composition.
- Verify safety metadata against behavior. Use the existing extension vocabulary.
- Run the existing validators and Redocly through the documentation build.
  Resolve documentation warnings for new and updated operations. Record verification gaps
  and any downstream MCP pin update in the PR.

A documentation publish does not automatically expose new MCP capabilities.

## Branches

| Branch | Backend | Publishes |
| --- | --- | --- |
| `dev` | staging | `docs.staging.formaloo.com` |
| `master` | production | `docs.formaloo.com` |

Base PRs on `dev` and merge into `dev`. **`dev` → `master` is the production
release** — a separate deliberate merge, never part of a feature PR. Commit as
`type(scope): message`.

What `master` publishes is a contract other repositories pin. So unmerged work
on `dev` is invisible to them, and renaming an `operationId` breaks them even
when the path is unchanged.

## Verifying a publish

Generated artifacts are gitignored and no releases are cut, so there is no
committed spec to read — download the workflow run's artifact instead.

A green deploy does not prove the CDN is serving the new file. Cache-bust and
check for content you expect; an unchanged byte size is a red flag.

## Agent skills

### Issue tracker

Issues and specs live in Linear (default team: Formaloo, key `FRM`); GitHub is for PRs only. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), label names unchanged. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`CONTEXT.md` + `docs/adr/` at the repo root, created lazily). See `docs/agents/domain.md`.
