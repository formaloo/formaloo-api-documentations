import fs from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const artifactsDir = path.join(rootDir, "artifacts");
const validationDir = path.join(artifactsDir, "validation");
const defaultSpecPath = path.join(artifactsDir, "intermediate", "openapi-mcp.filtered.json");
const settingsPath = path.join(rootDir, "spec", "mcp-openapi-settings.json");
const specPathInput = process.argv[2] ?? defaultSpecPath;
const specPath = path.isAbsolute(specPathInput) ? specPathInput : path.join(rootDir, specPathInput);

const httpMethods = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);
const requiredMcpKeys = [
  "tool_name",
  "aliases",
  "intent",
  "requires_workspace",
  "read_only",
  "destructive",
  "idempotent",
  "result_path",
  "user_data",
  "requires_confirmation"
];
const coreOperationIds = [
  "profileRetrieve",
  "businessesList",
  "businessesRetrieve",
  "formsList",
  "formsRetrieve",
  "formsRowsList",
  "boardsList",
  "formsCreate",
  "formsPartialUpdate",
  "formsDestroy",
  "fieldsRetrieve",
  "fieldsCreate",
  "fieldsDestroy",
  "formsRowsCreate"
];
const requiredMcpReadyOperationIds = [
  "themesList",
  "themesCreate",
  "themesRetrieve",
  "themesPartialUpdate"
];
const requiredPatchUpdateOperationIds = [
  "fieldsPartialUpdate",
  "formsPartialUpdate",
  "formFieldsPartialUpdate",
  "themesPartialUpdate"
];
const removedPutMigrationTargets = {
  fieldsUpdate: "fieldsPartialUpdate",
  formFieldsUpdate: "formFieldsPartialUpdate",
  formsUpdate: "formsPartialUpdate",
  paymentMethodsUpdate: "paymentMethodsPartialUpdate",
  themesUpdate: "themesPartialUpdate"
};

const settings = JSON.parse(await fs.readFile(settingsPath, "utf8"));
const spec = JSON.parse(await fs.readFile(specPath, "utf8"));
const errors = [];
const warnings = [];
const operations = new Map();
const excludeSettings = settings.exclude ?? {};
const excludedHttpMethods = new Set(asStringArray(excludeSettings.httpMethods).map((method) => method.toLowerCase()));
const approvedExcludedPutOperationIds = new Set(asStringArray(settings.approvedExcludedPutOperationIds));
const methodExceptions = new Map(
  Object.entries(settings.methodExceptions ?? {}).map(([method, operationIds]) => [
    method.toLowerCase(),
    new Set(asStringArray(operationIds))
  ])
);

function asStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sameMembers(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    expected.every((value) => actual.includes(value))
  );
}

function collectOperations() {
  for (const [pathKey, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") {
      continue;
    }

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!httpMethods.has(method) || !operation || typeof operation !== "object") {
        continue;
      }

      if (hasText(operation.operationId)) {
        operations.set(operation.operationId, {
          pathKey,
          method,
          operation
        });
      }
    }
  }
}

function hasUsable2xxSchema(operation) {
  for (const [statusCode, response] of Object.entries(operation.responses ?? {})) {
    if (!String(statusCode).startsWith("2") || !response || typeof response !== "object") {
      continue;
    }

    for (const media of Object.values(response.content ?? {})) {
      if (media?.schema) {
        return true;
      }
    }
  }

  return false;
}

function hasResponseExample(operation) {
  for (const response of Object.values(operation.responses ?? {})) {
    if (!response || typeof response !== "object") {
      continue;
    }

    for (const media of Object.values(response.content ?? {})) {
      if (media && typeof media === "object" && (media.example || media.examples)) {
        return true;
      }
    }
  }

  return false;
}

function resolveSchema(schema) {
  if (!schema || typeof schema !== "object") {
    return null;
  }

  if (typeof schema.$ref !== "string" || !schema.$ref.startsWith("#/")) {
    return schema;
  }

  let current = spec;
  for (const part of schema.$ref.slice(2).split("/")) {
    current = current?.[part];
    if (!current) {
      return null;
    }
  }

  return current;
}

function schemaLooksLikeFormalooEnvelope(schema) {
  const target = resolveSchema(schema);
  if (!target || typeof target !== "object") {
    return false;
  }

  const properties = target.properties;
  return Boolean(
    properties &&
      typeof properties === "object" &&
      properties.status &&
      properties.errors &&
      properties.data
  );
}

function looksLikeFormalooEnvelopeExample(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.prototype.hasOwnProperty.call(value, "status") &&
      Object.prototype.hasOwnProperty.call(value, "errors") &&
      Object.prototype.hasOwnProperty.call(value, "data")
  );
}

function hasRequestExample(operation) {
  for (const media of Object.values(operation.requestBody?.content ?? {})) {
    if (media && typeof media === "object" && (media.example || media.examples)) {
      return true;
    }
  }

  return false;
}

function validateMcpMetadata(operationId, operation) {
  const metadata = operation["x-formaloo-mcp"];
  if (!metadata || typeof metadata !== "object") {
    errors.push(`${operationId} is missing x-formaloo-mcp metadata.`);
    return;
  }

  for (const key of requiredMcpKeys) {
    if (!(key in metadata)) {
      errors.push(`${operationId} x-formaloo-mcp is missing ${key}.`);
    }
  }

  if (!hasText(metadata.tool_name)) {
    errors.push(`${operationId} x-formaloo-mcp.tool_name must be non-empty.`);
  }

  if (!Array.isArray(metadata.aliases) || metadata.aliases.length === 0 || metadata.aliases.some((alias) => !hasText(alias))) {
    errors.push(`${operationId} x-formaloo-mcp.aliases must contain at least one non-empty alias.`);
  }

  if (!hasText(metadata.intent)) {
    errors.push(`${operationId} x-formaloo-mcp.intent must be non-empty.`);
  }

  if (!hasText(metadata.result_path)) {
    errors.push(`${operationId} x-formaloo-mcp.result_path must be non-empty.`);
  }

  for (const key of ["requires_workspace", "read_only", "destructive", "idempotent", "user_data", "requires_confirmation"]) {
    if (typeof metadata[key] !== "boolean") {
      errors.push(`${operationId} x-formaloo-mcp.${key} must be boolean.`);
    }
  }

  if (!metadata.read_only && metadata.requires_confirmation !== true) {
    errors.push(`${operationId} writes data but does not require confirmation.`);
  }

  if (operationId === "formsRowsList" && metadata.user_data !== true) {
    errors.push("formsRowsList must be marked as user_data.");
  }
}

function resolveParameter(parameter) {
  if (!parameter || typeof parameter !== "object") {
    return null;
  }

  if (typeof parameter.$ref !== "string" || !parameter.$ref.startsWith("#/")) {
    return parameter;
  }

  let current = spec;
  for (const part of parameter.$ref.slice(2).split("/")) {
    current = current?.[part];
    if (!current) {
      return null;
    }
  }

  return current;
}

function findHeaderParameter(pathKey, operation, headerName) {
  const parameters = [...(spec.paths?.[pathKey]?.parameters ?? []), ...(operation.parameters ?? [])];
  return (
    parameters
      .map(resolveParameter)
      .find(
        (parameter) =>
          parameter?.in === "header" &&
          typeof parameter.name === "string" &&
          parameter.name.toLowerCase() === headerName
      ) ?? null
  );
}

function validateHeaderRequirements() {
  for (const [operationId, { pathKey, method, operation }] of operations.entries()) {
    const label = `${operationId} ${method.toUpperCase()} ${pathKey}`;
    const apiKeyHeader = findHeaderParameter(pathKey, operation, "x-api-key");

    if (!apiKeyHeader) {
      errors.push(`${label} does not document the required x-api-key header.`);
    } else if (apiKeyHeader.required !== true) {
      errors.push(`${label} must mark x-api-key as required.`);
    }

    for (const headerName of ["x-workspace", "authorization"]) {
      const header = findHeaderParameter(pathKey, operation, headerName);
      if (header && header.required !== true) {
        errors.push(`${label} documents ${headerName} but does not mark it as required.`);
      }
    }

    const metadata = operation["x-formaloo-mcp"];
    if (metadata && typeof metadata.requires_workspace === "boolean") {
      const documentsWorkspace = findHeaderParameter(pathKey, operation, "x-workspace") !== null;
      if (metadata.requires_workspace !== documentsWorkspace) {
        errors.push(
          `${label} x-formaloo-mcp.requires_workspace is ${metadata.requires_workspace}, but the operation ${documentsWorkspace ? "documents" : "omits"} the x-workspace header.`
        );
      }
    }
  }
}

function validateDeleteSuccessResponses() {
  for (const [operationId, { pathKey, method, operation }] of operations.entries()) {
    if (method !== "delete") {
      continue;
    }

    const label = `${operationId} DELETE ${pathKey}`;
    const responses = operation.responses ?? {};
    if (!responses["200"]) {
      errors.push(`${label} must document a 200 success response.`);
    }

    if (responses["204"]) {
      errors.push(`${label} must not document a 204 response; Formaloo deletes answer with 200.`);
    }
  }
}

function validateResponseEnvelopes() {
  const baseEnvelope = spec.components?.schemas?.FormalooResponseEnvelope;
  const errorsSchema = spec.components?.schemas?.FormalooResponseErrors;
  if (!schemaLooksLikeFormalooEnvelope(baseEnvelope)) {
    errors.push("MCP spec must define components.schemas.FormalooResponseEnvelope with status, errors, and data properties.");
  }

  if (!errorsSchema || typeof errorsSchema !== "object") {
    errors.push("MCP spec must define components.schemas.FormalooResponseErrors.");
  }

  for (const [operationId, { pathKey, method, operation }] of operations.entries()) {
    let hasJsonSuccess = false;
    let missingEnvelope = false;
    let missingExampleEnvelope = false;

    for (const [statusCode, response] of Object.entries(operation.responses ?? {})) {
      if (!String(statusCode).startsWith("2") || !response || typeof response !== "object") {
        continue;
      }

      const media = response.content?.["application/json"];
      if (!media) {
        continue;
      }

      hasJsonSuccess = true;

      if (!schemaLooksLikeFormalooEnvelope(media.schema)) {
        missingEnvelope = true;
      }

      if (media.example && !looksLikeFormalooEnvelopeExample(media.example)) {
        missingExampleEnvelope = true;
      }

      for (const example of Object.values(media.examples ?? {})) {
        if (
          example &&
          typeof example === "object" &&
          Object.prototype.hasOwnProperty.call(example, "value") &&
          !looksLikeFormalooEnvelopeExample(example.value)
        ) {
          missingExampleEnvelope = true;
        }
      }
    }

    if (!hasJsonSuccess) {
      continue;
    }

    const label = `${operationId} ${method.toUpperCase()} ${pathKey}`;
    if (missingEnvelope) {
      errors.push(`${label} must model successful application/json responses as Formaloo envelope schemas.`);
    }

    if (operation["x-formaloo-response-envelope"]?.envelope !== true) {
      errors.push(`${label} is missing x-formaloo-response-envelope metadata.`);
    }

    if (missingExampleEnvelope) {
      errors.push(`${label} has a successful response example that is not wrapped in the Formaloo envelope.`);
    }
  }
}

function validateTypedHelperSchemas() {
  const expectedLogicArgumentTypes = [
    "field",
    "choice",
    "variable",
    "constant",
    "matrix",
    "table",
    "user",
    "row",
    "success_page",
    "link",
    "send_email_template",
    "send_email_receiver",
    "webhook",
    "slack",
    "pdf_template"
  ];
  const expectedLogicOperations = [
    "is",
    "is_not",
    "equal",
    "not_equal",
    "gt",
    "gte",
    "lt",
    "lte",
    "on",
    "not_on",
    "before",
    "after",
    "before_or_on",
    "after_or_on",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "is_answered",
    "smallest",
    "greatest",
    "has_changed_to",
    "and",
    "or",
    "always",
    "otherwise"
  ];
  const expectedLogicActions = [
    "show",
    "hide",
    "disable",
    "jump",
    "jump_to_success_page",
    "submit",
    "set",
    "add",
    "subtract",
    "multiply",
    "divide",
    "send_email",
    "send_webhook",
    "send_slack",
    "generate_pdf",
    "set_related",
    "redirect"
  ];
  const logicArgumentTypeEnum =
    spec.components?.schemas?.FormalooLogicArgument?.properties?.type?.enum;
  if (!sameMembers(logicArgumentTypeEnum, expectedLogicArgumentTypes)) {
    errors.push(
      "FormalooLogicArgument.type must match the backend operation/action argument constants."
    );
  }

  const logicOperationEnum =
    spec.components?.schemas?.FormalooLogicCondition?.properties?.operation?.enum;
  if (!sameMembers(logicOperationEnum, expectedLogicOperations)) {
    errors.push(
      "FormalooLogicCondition.operation must match the backend OperationType constants."
    );
  }

  const logicActionEnum =
    spec.components?.schemas?.FormalooLogicAction?.properties?.action?.enum;
  if (!sameMembers(logicActionEnum, expectedLogicActions)) {
    errors.push(
      "FormalooLogicAction.action must match the backend ActionType constants."
    );
  }

  const logicActionDescription =
    spec.components?.schemas?.FormalooLogicAction?.properties?.action
      ?.description ?? "";
  if (
    !logicActionDescription.includes("disable") ||
    !logicActionDescription.includes("no-op") ||
    !logicActionDescription.includes("dashboard UI does not expose")
  ) {
    errors.push(
      "FormalooLogicAction.action must document disable as backend-accepted but not active/recommended."
    );
  }

  const logicConditionArgRefs =
    spec.components?.schemas?.FormalooLogicCondition?.properties?.args?.items?.anyOf
      ?.map((item) => item?.$ref)
      .filter(Boolean) ?? [];
  if (
    !logicConditionArgRefs.includes("#/components/schemas/FormalooLogicArgument") ||
    !logicConditionArgRefs.includes("#/components/schemas/FormalooLogicShallowCondition")
  ) {
    errors.push(
      "FormalooLogicCondition.args.items must compose FormalooLogicArgument and FormalooLogicShallowCondition with anyOf."
    );
  }

  const builderField = spec.components?.schemas?.FormalooBuilderFieldInput;
  if (builderField?.properties) {
    const builderBulkChoices = builderField.properties.bulk_choices;
    const hasBulkChoicesArray = builderBulkChoices?.oneOf?.some(
      (item) => item?.type === "array" && item?.items?.type === "string"
    );
    const hasBulkChoicesString = builderBulkChoices?.oneOf?.some((item) => item?.type === "string");
    if (!hasBulkChoicesArray || !hasBulkChoicesString) {
      errors.push("FormalooBuilderFieldInput.bulk_choices must explicitly allow string[] or newline string.");
    }
  }

  for (const [enumName, expectedValue] of Object.entries({
    FormBuilderWebsiteFieldTypeEnum: "website",
    FormBuilderMultipleSelectFieldTypeEnum: "multiple_select",
    FormBuilderRatingFieldTypeEnum: "rating",
    FormBuilderRepeatingSectionFieldTypeEnum: "repeating_section"
  })) {
    const values = spec.components?.schemas?.[enumName]?.enum;
    if (values && (!Array.isArray(values) || !values.includes(expectedValue))) {
      errors.push(`${enumName} must include ${expectedValue}.`);
    }
  }

  for (const schemaName of [
    "FormBuilderChoiceFieldRequest",
    "FormBuilderDropdownFieldRequest",
    "FormBuilderMultipleSelectFieldRequest"
  ]) {
    const bulkChoices = spec.components?.schemas?.[schemaName]?.properties?.bulk_choices;
    if (!bulkChoices) {
      continue;
    }

    const hasArray = bulkChoices.oneOf?.some((item) => item?.type === "array" && item?.items?.type === "string");
    const hasString = bulkChoices.oneOf?.some((item) => item?.type === "string");
    if (!hasArray || !hasString) {
      errors.push(`${schemaName}.bulk_choices must explicitly allow string[] or newline string.`);
    }
  }
}

collectOperations();
validateHeaderRequirements();
validateDeleteSuccessResponses();
validateResponseEnvelopes();
validateTypedHelperSchemas();

for (const operationId of coreOperationIds) {
  validateRequiredOperation(operationId, "Required MCP core operation");
}

for (const operationId of requiredMcpReadyOperationIds) {
  validateRequiredOperation(operationId, "Required MCP-ready operation");
}

validateMethodExclusions();
validatePutSettings();
validatePatchFirstUpdates();
validatePaymentMethodPutException();

function validateRequiredOperation(operationId, label) {
  const record = operations.get(operationId);
  if (!record) {
    errors.push(`${label} ${operationId} is not present.`);
    return;
  }

  const { operation, method, pathKey } = record;
  if (!hasText(operation.summary)) {
    errors.push(`${operationId} ${method.toUpperCase()} ${pathKey} must have a summary.`);
  }

  if (!hasText(operation.description)) {
    errors.push(`${operationId} ${method.toUpperCase()} ${pathKey} must have a description.`);
  }

  if (!hasUsable2xxSchema(operation)) {
    errors.push(`${operationId} ${method.toUpperCase()} ${pathKey} must have a usable 2xx response schema.`);
  }

  if (!hasResponseExample(operation)) {
    errors.push(`${operationId} ${method.toUpperCase()} ${pathKey} must have a response example.`);
  }

  if (["post", "put", "patch"].includes(method) && !hasRequestExample(operation)) {
    errors.push(`${operationId} ${method.toUpperCase()} ${pathKey} must have a request example.`);
  }

  validateMcpMetadata(operationId, operation);
}

function validateMethodExclusions() {
  for (const [operationId, { method, pathKey }] of operations.entries()) {
    const methodToken = method.toLowerCase();
    if (!excludedHttpMethods.has(methodToken)) {
      continue;
    }

    const allowedOperationIds = methodExceptions.get(methodToken) ?? new Set();
    if (!allowedOperationIds.has(operationId)) {
      errors.push(
        `${operationId} ${method.toUpperCase()} ${pathKey} uses excluded HTTP method ${method.toUpperCase()}. Add an explicit reviewed exception or remove it from the MCP spec.`
      );
    }
  }

  for (const [method, operationIds] of methodExceptions.entries()) {
    if (!excludedHttpMethods.has(method)) {
      errors.push(`methodExceptions.${method} is configured but ${method.toUpperCase()} is not excluded.`);
    }

    for (const operationId of operationIds) {
      const record = operations.get(operationId);
      if (!record) {
        errors.push(`methodExceptions.${method} includes ${operationId}, but that operation is not present in the MCP spec.`);
        continue;
      }

      if (record.method !== method) {
        errors.push(
          `methodExceptions.${method} includes ${operationId}, but the operation method is ${record.method.toUpperCase()}.`
        );
      }
    }
  }
}

function validatePutSettings() {
  if (!Array.isArray(settings.approvedExcludedPutOperationIds)) {
    errors.push("approvedExcludedPutOperationIds must be an array.");
  }

  if (
    settings.methodExceptions !== undefined &&
    (!settings.methodExceptions || typeof settings.methodExceptions !== "object" || Array.isArray(settings.methodExceptions))
  ) {
    errors.push("methodExceptions must be an object keyed by HTTP method.");
  }

  for (const [method, operationIds] of Object.entries(settings.methodExceptions ?? {})) {
    if (!Array.isArray(operationIds)) {
      errors.push(`methodExceptions.${method} must be an array.`);
    }
  }

  if (approvedExcludedPutOperationIds.has("paymentMethodsUpdate")) {
    errors.push("paymentMethodsUpdate must be retained through methodExceptions.put, not approvedExcludedPutOperationIds.");
  }

  for (const method of methodExceptions.keys()) {
    if (method !== "put") {
      errors.push(`methodExceptions.${method} is not supported for the MCP artifact.`);
    }
  }

  const putExceptions = methodExceptions.get("put") ?? new Set();
  for (const operationId of putExceptions) {
    if (operationId !== "paymentMethodsUpdate") {
      errors.push(`Only paymentMethodsUpdate may be retained as a PUT exception, found ${operationId}.`);
    }

    if (approvedExcludedPutOperationIds.has(operationId)) {
      errors.push(`${operationId} cannot be both retained and approved for PUT exclusion.`);
    }
  }
}

function validatePatchFirstUpdates() {
  for (const operationId of requiredPatchUpdateOperationIds) {
    const record = operations.get(operationId);
    if (!record) {
      errors.push(`Required PATCH update operation ${operationId} is not present.`);
      continue;
    }

    if (record.method !== "patch") {
      errors.push(`Required update operation ${operationId} must use PATCH, found ${record.method.toUpperCase()}.`);
    }
  }

  for (const [operationId, patchCounterpart] of Object.entries(removedPutMigrationTargets)) {
    const record = operations.get(operationId);
    if (record?.method === "put" && operationId !== "paymentMethodsUpdate") {
      errors.push(`${operationId} was removed from the MCP spec; use PATCH operation ${patchCounterpart} instead.`);
    }
  }
}

function validatePaymentMethodPutException() {
  const allowedPutExceptions = methodExceptions.get("put") ?? new Set();
  const actualPutOperations = [...operations.entries()].filter(([, record]) => record.method === "put");
  const unexpectedConfiguredExceptions = [...allowedPutExceptions].filter((operationId) => operationId !== "paymentMethodsUpdate");

  if (unexpectedConfiguredExceptions.length > 0) {
    errors.push(`Only paymentMethodsUpdate may be allowlisted as a PUT exception, found: ${unexpectedConfiguredExceptions.join(", ")}.`);
  }

  for (const [operationId, { pathKey }] of actualPutOperations) {
    if (operationId !== "paymentMethodsUpdate") {
      errors.push(`${operationId} PUT ${pathKey} is not allowed in the MCP spec; use PATCH when available.`);
    }
  }

  const paymentPut = operations.get("paymentMethodsUpdate");
  if (allowedPutExceptions.has("paymentMethodsUpdate")) {
    if (!paymentPut) {
      errors.push("paymentMethodsUpdate is allowlisted as a PUT exception, but it is not present in the MCP spec.");
      return;
    }

    if (paymentPut.method !== "put") {
      errors.push(`paymentMethodsUpdate must remain PUT while allowlisted, found ${paymentPut.method.toUpperCase()}.`);
    }

    if (!paymentPut.operation.description?.includes("Temporary legacy PUT exception")) {
      errors.push("paymentMethodsUpdate must be described as a temporary legacy PUT exception.");
    }

    const metadata = paymentPut.operation["x-formaloo-legacy-put"];
    if (metadata?.legacy_put_exception !== true || metadata?.temporary !== true) {
      errors.push("paymentMethodsUpdate x-formaloo-legacy-put metadata must mark it as a temporary legacy PUT exception.");
    }
  }

  const paymentPatch = operations.get("paymentMethodsPartialUpdate");
  const paymentPatchOnSamePath =
    paymentPut &&
    [...operations.values()].some((record) => record.method === "patch" && record.pathKey === paymentPut.pathKey);
  if (allowedPutExceptions.has("paymentMethodsUpdate") && (paymentPatch?.method === "patch" || paymentPatchOnSamePath)) {
    errors.push(
      "paymentMethodsUpdate is still allowlisted as a PUT exception, but a PATCH payment method update operation is available. Remove the PUT exception and use PATCH."
    );
  }
}

for (const [operationId, { operation, method, pathKey }] of operations.entries()) {
  if (!hasText(operation.description)) {
    warnings.push(`${operationId} ${method.toUpperCase()} ${pathKey} has no operation description.`);
  }

  for (const parameter of operation.parameters ?? []) {
    if (parameter && typeof parameter === "object" && !parameter.$ref && !hasText(parameter.description)) {
      warnings.push(`${operationId} ${method.toUpperCase()} ${pathKey} parameter ${parameter.name} has no description.`);
    }
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  operationCount: operations.size,
  coreOperationCount: coreOperationIds.length,
  mcpReadyOperationCount: requiredMcpReadyOperationIds.length,
  errors,
  warnings
};

const markdownLines = [
  "# MCP OpenAPI validation summary",
  "",
  `- Generated at: ${summary.generatedAt}`,
  `- Operation count: ${summary.operationCount}`,
  `- Required MCP core operation count: ${summary.coreOperationCount}`,
  `- Required MCP-ready operation count: ${summary.mcpReadyOperationCount}`,
  "",
  "## Errors",
  ...(errors.length > 0 ? errors.map((error) => `- ${error}`) : ["- None"]),
  "",
  "## Warnings",
  ...(warnings.length > 0 ? warnings.map((warning) => `- ${warning}`) : ["- None"]),
  ""
];

await fs.mkdir(validationDir, { recursive: true });
await fs.writeFile(path.join(validationDir, "mcp-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(validationDir, "mcp-summary.md"), markdownLines.join("\n"), "utf8");

if (errors.length > 0) {
  console.error(markdownLines.join("\n"));
  process.exit(1);
}

console.log(markdownLines.join("\n"));
