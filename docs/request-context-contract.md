# Source-owned authentication and workspace declarations

Backend views, permissions, authenticators and tenant resolvers own request prerequisites. The documentation publisher preserves those declarations; it does not decide permissions from HTTP methods, endpoint names, or the presence of a selector header.

The shared formz `idealib` schema generator obtains header declarations from permission classes and method-specific permissions. Public views must not acquire an API-key requirement merely by using that generator. Service-owned annotations remain necessary for dynamic permissions and conditional tenant/actor rules.

Authentication, application access, tenant resolution, resource permissions and entitlements are separate gates. A workspace-bound key can supply required tenant context while making `x-workspace` optional. Workspace listing precedes selection. Portal context and URL-target workspace administration have different rules. The formz and ICAS resolvers must not be treated as interchangeable: their membership requirements differ.

Normalization preserves source header flags/descriptions, inherited parameters and authentication AND/OR alternatives, scopes and anonymous alternatives. Missing legacy header annotations retain narrow compatibility fallbacks until the owning source publishes them. Unresolved security schemes fail rather than being silently dropped. The MCP builder preserves source metadata over compatibility defaults. Its validator compares retained operation headers, security and context with the normalized source contract.

Generated `x-formaloo-mcp.auth.*.required` describes the documented header requirement. It does not certify backend authentication or tenant semantics. `requires_workspace` is an explicit backend assertion when available; otherwise it is **null (unverified)**. An optional proposed `x-formaloo-request-context.workspace.requirement` can carry `required`, `optional`, or `not_applicable` from a reviewed backend declaration. This extension is not a standard or a complete metadata pipeline. Source-auth metadata can remain richer than these compatibility fields.

MCP/CLI own credential injection and user-selected connection/session state. Backend key binding or URL-target rules determine effective context. ICAS owns MCP token resource/scope validation; retain adapter validation until equivalent core enforcement exists. A schema refactor does not change runtime permission checks or prove all operations' behavior.

Rollout order: shared-library change and owning service pin/deployment; docs `dev` build and staging review; deliberate `dev` to `master` promotion; downstream reviewed spec sync. Do not patch consumer pins by hand to claim that an unpublished source change is already authoritative.
