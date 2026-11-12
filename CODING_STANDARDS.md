# API documentation

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

