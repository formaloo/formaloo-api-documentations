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

collectOperations();

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
