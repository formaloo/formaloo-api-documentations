# Issue tracker: Linear

Issues and specs for this repo live in Linear, not GitHub Issues (GitHub is used for PRs only). Use the Linear MCP tools (`linear-server`) for all operations.

- **Default team**: `Formaloo` (key `FRM`; identifiers look like `FRM-123`). Ask the user if the work clearly belongs to another team (e.g. `PQ` for unaccepted ideas).
- Always show the user the drafted title and body and get a yes before creating or editing an issue.

## Conventions

- **Create an issue**: `save_issue` with `team`, `title`, and a Markdown `description`. Use real newlines, not `\n`.
- **Read an issue**: `get_issue` with the identifier (e.g. `FRM-123`) or URL, then `list_comments` for its comments.
- **List issues**: `list_issues`, filtered by `team`, `label`, `state`, `assignee` as needed.
- **Comment on an issue**: `save_comment`.
- **Apply / remove labels**: `save_issue` with the updated `labels` list. If a label from `docs/agents/triage-labels.md` doesn't exist yet, create it in the team with `create_issue_label` (after confirming with the user).
- **Close**: move the issue to a completed or canceled state with `save_issue`, after adding a comment explaining why.

## Pull requests as a triage surface

**PRs as a request surface: no.** PRs live on GitHub (`formaloo/formaloo-api-documentations`) and are not triaged as requests.

## When a skill says "publish to the issue tracker"

Create a Linear issue in the default team.

## When a skill says "fetch the relevant ticket"

`get_issue` with the Linear identifier, plus `list_comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a parent issue and its **child** issues are the tickets.

- **Map**: a Linear issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: a sub-issue of the map (set `parentId`). Labels: `wayfinder:<type>` (`research` / `prototype` / `grilling` / `task`).
- **Blocking**: Linear's native "blocked by" relation. A ticket is unblocked when every blocker is completed or canceled.
- **Frontier query**: the map's open sub-issues with no open blocker and no assignee, in map order.
- **Claim**: assign the issue to the driving dev. This is the session's first write.
- **Resolve**: comment with the answer, complete the issue, then append a context pointer (gist + link) to the map's Decisions-so-far.
