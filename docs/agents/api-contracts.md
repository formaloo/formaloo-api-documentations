# Publishing API contracts

Read this document when adding or changing an operation, schema, description,
normalization rule or MCP metadata in the publisher.

## Ownership

Backend services own operation IDs, request and response schemas, validation,
permissions and side effects. Correct those facts in the owning service first.
Enrich them here only when service schema annotations cannot express the result.
Record the source implementation or contract limitation in the PR.

MCP owns discovery keywords, tool names, composed workflows and execution
safeguards. Keep those decisions in MCP. Existing publisher metadata must
describe verified API facts. A generated safety hint is not evidence that the
operation is safe.

## Review new and changed operations

- Preserve stable operation IDs and actual identifiers, defaults, enums, nullability and constraints.
- Require a useful summary and description. Explain workspace context, prerequisites and observable effects.
- Check nested inputs, cross-field conditions and representative synthetic examples.
- Preserve actual response envelopes, pagination, errors and asynchronous completion details.
- Compare public and MCP artifacts. Explain intentional exclusions and verify that new operations appear in the intended contract.
- Check generated read-only, destructive and idempotency hints against the source implementation.
- Use the existing metadata vocabulary. Agree on new extension fields with consumers before adding them.
- Keep shared API explanations in one source. Avoid parallel public and MCP copies of the same endpoint description.

Run the existing validators and Redocly through the documentation build.
A missing description currently produces a warning. Resolve warnings for
operations changed by the PR. A successful build does not prove that a
description matches backend behavior, so check the owning implementation.

## Publication and MCP availability

A backend deployment supplies a new source schema. The publisher must publish
the combined contract before MCP can import it. After publication, inspect the
served artifact for the expected operation IDs, fields and descriptions.

MCP uses reviewed pinned contracts. Its sync can reject an operation that lacks
task ownership or an exposure decision. Report that failure as downstream work.
Do not describe a documentation publish as automatic MCP availability.

Keep schema checks generic. Use an explicit consumer contract for endpoints
that must exist. A documentation-only PR must not silently enable capabilities
or change the release branch.

