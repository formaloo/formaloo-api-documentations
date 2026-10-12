# Publish source-owned MCP capability selections

Status: planning draft; no build/runtime behavior changed. Related work: FRM-3960, Formz source-selection plan, FormalooMCP canonical/discovery plan. This is phase two, not a prerequisite for the first curated plugin release.

## Responsibilities

The backend service is the authority for API schema and its reviewed MCP operation selection. This repository publishes that contract; it does not own API behavior. Keep API descriptions in their owning backend, MCP composition semantics in MCP and client loading choices in an explicit server profile.

Base implementation PRs on dev. Staging is docs.staging.formaloo.com. Production requires a separate deliberate dev → master promotion and verification at docs.formaloo.com. A local generated artifact or green build is not production evidence.

## Proposed implementation steps

1. Consume the reviewed versioned selection metadata from each fetched source service. Preserve original operation IDs, summaries/descriptions, request/response schemas and source x-formaloo-mcp selection fields. The proposed extension transports public/internal/excluded exposure, stable capability identity and feature grouping; agree exact shape with the source and MCP before writing code.
2. Replace competing hardcoded publication decisions only after their existing intent is mapped and fact-checked. Do not overwrite a source field with old coreMcpOperations text or automatically generate unverified behavioral annotations. Service aggregation must not make Formz metadata govern ICAS/auth/storage endpoints.
3. Validate selection metadata, original-ID provenance and cross-service canonical-name/capability collisions. New/unreviewed operations are reported and cannot become public tools silently. Missing metadata must not silently flip an existing deployed surface before the migration profile is enabled.
4. Keep internal dependency contracts in the MCP artifact where supported compositions need them. Do not filter them out merely because they have no separate public tool. Excluded operations must not return through public-spec fallback, broad retained-operation overrides or generic execution.
5. Publish an audit artifact recording source revision/hash, operation IDs, selected public capabilities, internal dependencies, exclusions, unreviewed candidates and description-resource extraction information supplied by the MCP conversion stage. Report both operation count and distinct capability count; aliases are not new capabilities.
6. Retain the complete public API artifact for REST documentation/inventory. Its wider scope must not automatically broaden MCP exposure. MCP runtime must strictly use the intended verified pin/profile for submission.

## Meaningful validation

- A real source export retains original API constraints and descriptions through merge/normalization/build.
- Public/internal/excluded selections survive projection without enabling an excluded operation.
- Missing/unknown metadata and cross-service collisions produce actionable failures at agreed migration boundaries.
- A source internal typed block endpoint remains available to a curated app composition without creating a second public peer tool.
- Candidate and served staging/production artifacts are checked by content and hash, not only byte size.

Avoid tests that merely assert prose, exact arbitrary catalog totals or mirror the projection implementation. Existing contract tests remain required. Existing Publisher #53 source-preservation work must land/be incorporated before removing further overlays; this draft does not change it.

## Sequence and rollback

Source manifest implementation/export → staging publication → candidate MCP pin/coverage/client validation → production source release → deliberate docs dev → master → released artifact verification → MCP pin refresh/profile rollout → plugin rescan.

If staging validation fails, leave the currently released artifacts and plugin profile in place. Metadata-only source additions can stay deployed if old consumers ignore them; do not roll forward with guessed/missing eligibility decisions. Restore prior verified publication/pin if required.

## Client surface

MCP consumer may publish a compact discovery/details/execution family over this selected catalog, or an explicitly configured individual-tools profile. Publisher does not choose model context loading or vary the catalog based on a guessed client User-Agent. The documented patterns from PostHog/Stripe/Cloudflare are application choices, not a standard OpenAPI flag:

- https://github.com/PostHog/posthog/blob/master/services/mcp/definitions/README.md
- https://docs.stripe.com/mcp#tools
- https://developers.cloudflare.com/agents/model-context-protocol/codemode/

## Completion definition

This draft is a reviewable implementation plan only. Creating/merging it does not implement source manifests or conversion behavior. A subsequent implementation PR must meet the above checks and provide real source/publication evidence.
