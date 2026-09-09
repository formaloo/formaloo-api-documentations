# Working in this repository

`CLAUDE.md` is a symlink to this file. Add symlinks for other tools, not copies.

This repository generates the published API contract; it does not own it.
Schemas come from the backend serializers in `formaloo/formz_core`
(drf-spectacular). **Fix a wrong schema there.** Enrich here only what the
backend cannot express.

## Branches

| Branch | Backend | Publishes |
| --- | --- | --- |
| `dev` | staging | `docs.staging.formaloo.com` |
| `master` | production | `docs.formaloo.com` |

Base PRs on `dev` and merge into `dev`. **`dev` → `master` is the production
release** — a separate deliberate merge, never part of a feature PR.

What `master` publishes is a contract other repositories pin. So unmerged work
on `dev` is invisible to them, and renaming an `operationId` breaks them even
when the path is unchanged.

## Verifying a publish

Generated artifacts are gitignored and no releases are cut, so there is no
committed spec to read — download the workflow run's artifact instead.

A green deploy does not prove the CDN is serving the new file. Cache-bust and
check for content you expect; an unchanged byte size is a red flag.
