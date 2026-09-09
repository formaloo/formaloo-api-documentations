---
name: publish-production-docs
description: Promote docs `dev` to `master`, publishing the production API contract to docs.formaloo.com. Use when asked to publish, promote, release, or ship the API docs, or to get the latest docs live.
---

# Publishing production docs

Promotion is `dev` → `master`. See `AGENTS.md` for the branch model; this is the
procedure and its verification steps.

This publishes a contract that downstream repositories pin. Treat it as a
release.

## 1. Know what you are publishing

```bash
gh api repos/formaloo/formaloo-api-documentations/compare/master...dev \
  -q '"ahead=\(.ahead_by) behind=\(.behind_by)"'
gh api repos/formaloo/formaloo-api-documentations/compare/master...dev \
  -q '.commits[]|"\(.commit.author.date[0:10])  \(.commit.message|split("\n")[0])"'
```

`behind_by > 0` is normal — `master` carries merge commits `dev` does not. It
does not mean `dev` is missing work.

Read the commit list. If anything is not meant to go live yet, stop: the whole
branch promotes together.

## 2. Confirm the build is good before merging

The last `dev` deploy already built the exact artifacts `master` will publish.
Download and inspect them rather than assuming:

```bash
gh run list --repo formaloo/formaloo-api-documentations --branch dev \
  --workflow "Deploy Public Docs" --limit 1
gh run download <run-id> --repo formaloo/formaloo-api-documentations --dir /tmp/docs-artifact
```

Sanity-check the MCP artifact's operation count against the current published
one. A large drop means the exclusion filter is eating operations.

## 3. Dry-run the merge

```bash
git fetch origin dev master
git checkout master && git pull
git merge --no-commit --no-ff origin/dev    # inspect, then --abort or commit
```

Build inputs (`scripts/`, `spec/`, `generate.sh`) should end up identical to
`dev`. If they do not, resolve toward `dev` — that is the branch whose build you
just verified.

## 4. Merge

```bash
gh api -X POST repos/formaloo/formaloo-api-documentations/merges \
  -f base=master -f head=dev -f commit_message="Merge branch 'dev'"
```

## 5. Verify it actually published

Do not trust a green deploy alone — Cloudflare Pages serves through a CDN, and
a stale response looks identical to a fresh one. Cache-bust and check content:

```bash
curl -sS -H "Cache-Control: no-cache" \
  "https://docs.formaloo.com/openapi-v3.0.yaml?cb=$(date +%s)" \
  | grep -c "<a schema or description you expect to be new>"
```

Byte-identical size to the pre-merge fetch is a red flag, not reassurance.

## 6. Confirm the downstream dispatch fired

The deploy notifies FormalooMCP, which resyncs its pinned specs. Check the
notify step succeeded, then that the sync ran:

```bash
gh run list --repo formaloo/FormalooMCP --workflow "OpenAPI Sync" --limit 3
```

A skipped notify step means `MCP_DISPATCH_TOKEN` is missing or expired. The
publish still succeeded; the pin just will not update until someone runs the
sync manually via `workflow_dispatch`.

## If the sync fails on operation policy

FormalooMCP refuses to overwrite a pin whose contract no longer covers its
operation policy, and reports the missing operation ids. Usual causes:

- an `operationId` was renamed upstream — the path is often unchanged, so
  compare paths before assuming an operation was removed
- the MCP exclusion filter in `spec/mcp-openapi-settings.json` is dropping them
- the operation never reached the `mcp-1.0` contract and needs adding to
  `requiredOperationIds` in `scripts/backfill-mcp-operations.mjs`

Fix it here and republish. Do not hand-patch the downstream pin — the next sync
overwrites it.
