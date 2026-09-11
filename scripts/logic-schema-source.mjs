// Single source for deriving Formaloo's hand-authored logic overlay schemas'
// enums (FormalooLogicRule.type, FormalooLogicAction.action,
// FormalooLogicCondition.operation, FormalooLogicArgument.type) from the
// backend's own generated schema, instead of hand-typing a duplicate that can
// silently drift out of sync with it.
//
// This is exactly how FRM-3448 (FormalooMCPserver) happened: the backend
// added `schedule`/`add_row`/`edit_row`/`send_whatsapp`/`wait` to its logic
// contract, and three independent hand-typed copies of these enums --
// normalize-openapi.mjs (which builds the overlay), plus validate-openapi.mjs
// and validate-mcp-openapi.mjs (which each separately re-typed what they
// expected the overlay to contain) -- never caught up, and could not have
// caught each other drifting since none of them compared against the actual
// backend schema. All three now import from here, so they can only ever
// disagree with the backend, not with each other.
//
// Backend-generated, named enums this repo does not need to retype: see
// formz_core formz/logic/utils/constants.py LogicType, ActionType,
// OperationType, and ActionArgumentType, and the matching drf-spectacular
// components (LogicTypeEnum, LogicActionTypeEnum, LogicOperationTypeEnum,
// ActionArgumentTypeEnum) in the fetched formz/formz-mcp contracts.

export const FALLBACK_LOGIC_RULE_TYPES = ["field", "submit", "update"];

export const FALLBACK_LOGIC_ACTIONS = [
  "jump",
  "jump_to_success_page",
  "hide",
  "show",
  "disable",
  "set",
  "submit",
  "redirect",
  "add",
  "multiply",
  "subtract",
  "divide",
  "send_email",
  "send_webhook",
  "send_slack",
  "generate_pdf",
  "set_related"
];

export const FALLBACK_LOGIC_OPERATIONS = [
  "equal",
  "not_equal",
  "gt",
  "lt",
  "gte",
  "lte",
  "greatest",
  "smallest",
  "is",
  "is_not",
  "on",
  "not_on",
  "before",
  "after",
  "before_or_on",
  "after_or_on",
  "is_answered",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "has_changed_to",
  "and",
  "or",
  "always",
  "otherwise"
];

export const FALLBACK_ACTION_ARGUMENT_TYPES = [
  "field",
  "success_page",
  "link",
  "constant",
  "variable",
  "choice",
  "send_email_template",
  "send_email_receiver",
  "webhook",
  "slack",
  "pdf_template"
];

// Condition-side argument kinds (backend's OperationArgumentType) have no
// separately named component in the generated spec -- drf-spectacular only
// hoists an enum into a shared component when it is reused across 2+ places,
// and this one is referenced from a single serializer field, so it stays
// inlined with no stable name to read back. Kept in sync by hand with
// formz_core formz/logic/utils/constants.py OperationArgumentType.choices;
// review it if backend adds a new condition-side argument kind.
export const CONDITION_ARGUMENT_TYPES = ["field", "matrix", "table", "choice", "user", "row"];

function deriveEnum(schemas, schemaName, fallback) {
  const values = schemas?.[schemaName]?.enum;
  return Array.isArray(values) && values.length > 0 ? [...values] : fallback;
}

// Derives every Formaloo logic overlay enum from one `components.schemas`
// object -- pass the backend-generated map before anything overlays or
// prunes it (the raw merged spec, not the final Formaloo*-rewritten one).
export function deriveLogicEnums(schemas) {
  const ruleTypes = deriveEnum(schemas, "LogicTypeEnum", FALLBACK_LOGIC_RULE_TYPES);
  const actions = deriveEnum(schemas, "LogicActionTypeEnum", FALLBACK_LOGIC_ACTIONS);
  const operations = deriveEnum(schemas, "LogicOperationTypeEnum", FALLBACK_LOGIC_OPERATIONS);
  const actionArgumentTypes = deriveEnum(schemas, "ActionArgumentTypeEnum", FALLBACK_ACTION_ARGUMENT_TYPES);
  // FormalooLogicArgument intentionally unions condition-side and action-side
  // argument kinds into one schema -- it is the single shape MCP/CLI callers
  // use for both condition args (`value`) and action args (`identifier`).
  const argumentTypes = [
    ...new Set([...CONDITION_ARGUMENT_TYPES, "constant", "variable", ...actionArgumentTypes])
  ];
  return { ruleTypes, actions, operations, argumentTypes };
}
