import fs from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const artifactsDir = path.join(rootDir, "artifacts");
const validationDir = path.join(artifactsDir, "validation");
const normalizedSpecPath = path.join(artifactsDir, "intermediate", "openapi-public.normalized.json");
const publicContractPath = path.join(rootDir, "spec", "public-contract.json");
const introPath = path.join(rootDir, "spec", "docs", "v3.0", "intro.md");
const metadataPath = path.join(rootDir, "spec", "operation-metadata.json");
const finalYamlPath = path.join(rootDir, "openapi-v3.0.yaml");

const allowedMetadataKeys = new Set([
  "stability",
  "audience",
  "recommended",
  "complexity",
  "statefulness"
]);

const spec = JSON.parse(await fs.readFile(normalizedSpecPath, "utf8"));
const publicContract = JSON.parse(await fs.readFile(publicContractPath, "utf8"));
const introContents = await fs.readFile(introPath, "utf8");

const errors = [];
const warnings = [];
const defaultPrefix = publicContract.defaultVersionPrefix;
const legacyPaths = new Set(Object.keys(publicContract.legacyPaths));
const knownSecuritySchemes = new Set(Object.keys(spec.components?.securitySchemes ?? {}));

function sameMembers(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    expected.every((value) => actual.includes(value))
  );
}

const introDisallowedPatterns = [
  /https:\/\/api\.formaloo\.me\/v1\.0\//,
  /https:\/\/api\.formaloo\.me\/v2\.0\//,
  /v1\.0\/oauth2\/authorization-token/,
  /v2\.0\/oauth2\/authorization-token/
];

for (const pattern of introDisallowedPatterns) {
  if (pattern.test(introContents)) {
    errors.push(`Public intro contains stale version example matching ${pattern}`);
  }
}

const integrationMappingRefs = {
  FormHubspotIntegrationRequest: "#/components/schemas/FormalooHubspotMappedFields",
  FormMailchimpIntegrationRequest: "#/components/schemas/FormalooMailchimpMappedFields",
  FormNetsuiteIntegrationRequest: "#/components/schemas/FormalooNetsuiteMappedFields",
  FormNotionIntegrationRequest: "#/components/schemas/FormalooNotionMappedFields",
  FormSendinblueIntegrationRequest: "#/components/schemas/FormalooBrevoMappedFields",
  LeadEnrichmentIntegrationRequest: "#/components/schemas/FormalooLeadEnrichmentMappedFields"
};
for (const [schemaName, expectedRef] of Object.entries(integrationMappingRefs)) {
  const actualRef = spec.components?.schemas?.[schemaName]?.properties?.mapped_fields?.$ref;
  if (actualRef !== expectedRef) {
    errors.push(`${schemaName}.mapped_fields must reference ${expectedRef}.`);
  }
}

const expectedIntegrationAppTypes = [
  "slack", "google_sheet", "google_forms", "notion", "hubspot", "netsuite",
  "mailchimp", "brevo", "stripe", "paypal", "square", "razorpay",
  "active_campaign", "webhook", "email_template", "email_campaign",
  "pdf_generator", "make", "calendly", "recurring_submission",
  "lead_enrichment", "send_whatsapp"
];
const integrationAppTypes = spec.components?.schemas?.IntegrationAppTypeEnum?.enum;
if (!sameMembers(integrationAppTypes, expectedIntegrationAppTypes)) {
  errors.push("IntegrationAppTypeEnum must exactly match the 22 canonical backend integration types.");
}

const whatsappConnectionOperations = new Set([
  "whatsappConnectionRetrieve",
  "whatsappConnectionDestroy",
  "whatsappConnectionRedirectUrlRetrieve"
]);
const foundWhatsappConnectionOperations = new Map();
for (const pathItem of Object.values(spec.paths ?? {})) {
  for (const operation of Object.values(pathItem ?? {})) {
    if (!whatsappConnectionOperations.has(operation?.operationId)) continue;
    foundWhatsappConnectionOperations.set(operation.operationId, operation);
    if (/work[ -]?in[ -]?progress|\bWIP\b/i.test(operation.description ?? "")) {
      errors.push(`${operation.operationId} must not be documented as work in progress.`);
    }
  }
}
for (const operationId of whatsappConnectionOperations) {
  if (!foundWhatsappConnectionOperations.has(operationId)) {
    errors.push(`WhatsApp connection operation ${operationId} is missing from the public contract.`);
  }
}
const whatsappRedirectOperation = foundWhatsappConnectionOperations.get("whatsappConnectionRedirectUrlRetrieve");
for (const parameterName of ["active_business", "next", "phone_number"]) {
  const parameter = whatsappRedirectOperation?.parameters?.find(
    (candidate) => candidate?.in === "query" && candidate?.name === parameterName
  );
  if (!parameter?.required) {
    errors.push(`whatsappConnectionRedirectUrlRetrieve must require query parameter ${parameterName}.`);
  }
}
if (
  whatsappRedirectOperation?.responses?.["200"]?.content?.["application/json"]?.schema?.$ref !==
  "#/components/schemas/FormalooWhatsAppRedirectData"
) {
  errors.push("whatsappConnectionRedirectUrlRetrieve must document data.whatsapp_redirect.redirect_url.");
}
const whatsappRetrieveOperation = foundWhatsappConnectionOperations.get("whatsappConnectionRetrieve");
if (
  whatsappRetrieveOperation?.responses?.["200"]?.content?.["application/json"]?.schema?.$ref !==
  "#/components/schemas/FormalooWhatsAppConnectionData"
) {
  errors.push("whatsappConnectionRetrieve must document data.whatsapp_connection.");
}
if (!whatsappRetrieveOperation?.responses?.["404"]) {
  errors.push("whatsappConnectionRetrieve must document 404 when no connection exists.");
}
if (!sameMembers(
  spec.components?.schemas?.BusinessWhatsAppConnection?.properties?.status?.enum,
  ["connecting", "pending", "active", "error"]
)) {
  errors.push("BusinessWhatsAppConnection.status must exactly enumerate connecting, pending, active, and error.");
}
const whatsappDestroyOperation = foundWhatsappConnectionOperations.get("whatsappConnectionDestroy");
if (!whatsappDestroyOperation?.responses?.["200"] || whatsappDestroyOperation?.responses?.["204"]) {
  errors.push("whatsappConnectionDestroy must document the deployed 200 success response, not 204.");
}
if (!whatsappDestroyOperation?.responses?.["404"]) {
  errors.push("whatsappConnectionDestroy must document 404 when no connection exists.");
}

const integrationDiscoveryOperationIds = new Set([
  "hubspotIntegrationsPropertiesRetrieve",
  "mailchimpIntegrationsListsRetrieve",
  "mailchimpIntegrationsListsMergeFieldsRetrieve",
  "netsuiteIntegrationsMetadataRetrieve",
  "notionWorkspacesNotionDatabasesRetrieve",
  "sendinblueIntegrationsAttributesRetrieve",
  "sendinblueIntegrationsListsRetrieve"
]);
const foundIntegrationDiscoveryOperations = new Set();
for (const pathItem of Object.values(spec.paths ?? {})) {
  for (const operation of Object.values(pathItem ?? {})) {
    if (!integrationDiscoveryOperationIds.has(operation?.operationId)) continue;
    foundIntegrationDiscoveryOperations.add(operation.operationId);
    const hasTypedSuccess = Object.entries(operation.responses ?? {}).some(([statusCode, response]) =>
      /^2/u.test(statusCode) && Object.values(response?.content ?? {}).some((media) => media?.schema)
    );
    if (!hasTypedSuccess) {
      errors.push(`${operation.operationId} must expose a typed provider-metadata response.`);
    }
  }
}
for (const operationId of integrationDiscoveryOperationIds) {
  if (!foundIntegrationDiscoveryOperations.has(operationId)) {
    errors.push(`Integration discovery operation ${operationId} is missing from the public contract.`);
  }
}

const logicArgumentTypeEnum =
  spec.components?.schemas?.FormalooLogicArgument?.properties?.type?.enum;
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

const logicIdentifierDescription =
  spec.components?.schemas?.FormalooLogicArgument?.properties?.identifier
    ?.description ?? "";
if (
  !logicIdentifierDescription.includes("jump_to_success_page") ||
  !logicIdentifierDescription.includes("default_success_page")
) {
  errors.push(
    "FormalooLogicArgument.identifier must document the executable success-page routing contract."
  );
}

const logicConditionArgsItems =
  spec.components?.schemas?.FormalooLogicCondition?.properties?.args?.items;
const logicConditionArgRefs =
  logicConditionArgsItems?.anyOf?.map((item) => item?.$ref).filter(Boolean) ?? [];
if (
  !logicConditionArgRefs.includes("#/components/schemas/FormalooLogicArgument") ||
  !logicConditionArgRefs.includes("#/components/schemas/FormalooLogicShallowCondition")
) {
  errors.push(
    "FormalooLogicCondition.args.items must compose FormalooLogicArgument and FormalooLogicShallowCondition with anyOf."
  );
}

if (spec.components?.schemas?.FormalooBuilderFieldInput) {
  const builderBulkChoices =
    spec.components.schemas.FormalooBuilderFieldInput?.properties?.bulk_choices;
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

if (spec.info?.externalDocs) {
  errors.push("OpenAPI info.externalDocs should not be present in the final normalized spec.");
}

if (!spec.externalDocs) {
  warnings.push("Final normalized spec does not define top-level externalDocs.");
}

if (!Array.isArray(spec.tags) || spec.tags.length === 0) {
  errors.push("Final normalized spec must define at least one top-level tag.");
}

for (const tag of spec.tags ?? []) {
  if (typeof tag.description !== "string" || tag.description.trim() === "") {
    errors.push(`Top-level tag ${tag.name} must define a non-empty description.`);
  }
}

for (const pathKey of Object.keys(spec.paths)) {
  if (!pathKey.startsWith(defaultPrefix) && !legacyPaths.has(pathKey)) {
    errors.push(`Path ${pathKey} is outside the public default version and is not allowlisted as a legacy exception.`);
  }

  const pathItem = spec.paths[pathKey];
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!["get", "post", "put", "patch", "delete", "options", "head", "trace"].includes(method)) {
      continue;
    }

    for (const requirement of operation.security ?? []) {
      for (const schemeName of Object.keys(requirement ?? {})) {
        if (!knownSecuritySchemes.has(schemeName)) {
          errors.push(`Operation ${method.toUpperCase()} ${pathKey} references undefined security scheme ${schemeName}.`);
        }
      }
    }

    const has4xxResponse = Object.keys(operation.responses ?? {}).some((statusCode) => /^4\d\d$/.test(statusCode));
    if (!has4xxResponse) {
      errors.push(`Operation ${method.toUpperCase()} ${pathKey} must define at least one 4XX response.`);
    }

    if (legacyPaths.has(pathKey)) {
      if (!operation["x-formaloo-legacy-path"]) {
        errors.push(`Legacy path ${method.toUpperCase()} ${pathKey} is missing x-formaloo-legacy-path.`);
      }
    }
  }
}

try {
  await fs.access(finalYamlPath);
} catch {
  errors.push("Final YAML artifact openapi-v3.0.yaml was not generated.");
}

try {
  const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
  const operations = metadata?.operations ?? {};

  for (const [operationId, definition] of Object.entries(operations)) {
    for (const key of Object.keys(definition)) {
      if (!allowedMetadataKeys.has(key)) {
        errors.push(`Operation metadata for ${operationId} contains unsupported key ${key}.`);
      }
    }
  }
} catch {
  // optional file
}

const summary = {
  generatedAt: new Date().toISOString(),
  defaultVersionPrefix: defaultPrefix,
  pathCount: Object.keys(spec.paths ?? {}).length,
  topLevelTagCount: spec.tags?.length ?? 0,
  legacyPathCount: Object.keys(spec.paths ?? {}).filter((pathKey) => legacyPaths.has(pathKey)).length,
  errors,
  warnings
};

const markdownLines = [
  "# Public contract validation summary",
  "",
  `- Generated at: ${summary.generatedAt}`,
  `- Path count: ${summary.pathCount}`,
  `- Top-level tag count: ${summary.topLevelTagCount}`,
  `- Legacy path count: ${summary.legacyPathCount}`,
  "",
  "## Errors",
  ...(errors.length > 0 ? errors.map((error) => `- ${error}`) : ["- None"]),
  "",
  "## Warnings",
  ...(warnings.length > 0 ? warnings.map((warning) => `- ${warning}`) : ["- None"]),
  ""
];

await fs.mkdir(validationDir, { recursive: true });
await fs.writeFile(path.join(validationDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(validationDir, "summary.md"), markdownLines.join("\n"), "utf8");

if (errors.length > 0) {
  console.error(markdownLines.join("\n"));
  process.exit(1);
}

console.log(markdownLines.join("\n"));
