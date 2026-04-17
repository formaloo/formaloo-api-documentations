import fs from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const artifactsDir = path.join(rootDir, "artifacts");
const intermediateDir = path.join(artifactsDir, "intermediate");
const rawSpecPath = path.join(intermediateDir, "openapi-merged.raw.json");
const normalizedSpecPath = path.join(intermediateDir, "openapi-public.normalized.json");
const publicContractPath = path.join(rootDir, "spec", "public-contract.json");
const metadataPath = path.join(rootDir, "spec", "operation-metadata.json");
const tagMetadataPath = path.join(rootDir, "spec", "tag-metadata.json");
const apiKeyHeaderDescription = "Your API Key from the Formaloo dashboard.";
const workspaceHeaderDescription =
  "Current workspace identifier for workspace-scoped requests. Send this header when the endpoint requires a workspace context and your API key does not already identify the workspace.";
const appIdHeaderDescription =
  "Optional client portal or public app identifier. Use this header when the app explicitly provides an app identifier for portal-specific form submission.";
const scopeHeaderDescription =
  "Optional client portal scope identifier. Use this header on client portal authentication requests when your app relies on a specific scope.";
const clientCredentialsAuthorizationDescription =
  "Use `Basic {API Secret}`. The API Secret shown in the Formaloo dashboard can be used directly here.";
const endUserSessionAuthorizationDescription =
  "Use the end-user session token returned by the sign-in flow.";

const publicContract = JSON.parse(await fs.readFile(publicContractPath, "utf8"));
const spec = JSON.parse(await fs.readFile(rawSpecPath, "utf8"));

let metadata = null;
try {
  metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
} catch {
  metadata = null;
}

let tagMetadata = {};
try {
  tagMetadata = JSON.parse(await fs.readFile(tagMetadataPath, "utf8"));
} catch {
  tagMetadata = {};
}

const defaultServerUrl =
  process.env.PUBLIC_API_URL ||
  (process.env.STAGING_DOCS === "true"
    ? "https://api.staging.formaloo.com"
    : "https://api.formaloo.me");
const serverDescription =
  process.env.STAGING_DOCS === "true" ? "Formaloo Staging Server" : "Formaloo Server";

spec.externalDocs = spec.externalDocs ?? spec.info?.externalDocs;
if (spec.info?.externalDocs) {
  delete spec.info.externalDocs;
}

spec.servers = [
  {
    url: defaultServerUrl,
    description: serverDescription
  }
];

spec.components = spec.components ?? {};
spec.components.securitySchemes = spec.components.securitySchemes ?? {};
spec.components.responses = spec.components.responses ?? {};
if (!spec.components.securitySchemes.ApiKeyAuthentication) {
  spec.components.securitySchemes.ApiKeyAuthentication = {
    type: "apiKey",
    in: "header",
    name: "x-api-key",
    description: apiKeyHeaderDescription
  };
}
if (!spec.components.securitySchemes.JwtAuthentication) {
  spec.components.securitySchemes.JwtAuthentication = {
    type: "apiKey",
    in: "header",
    name: "Authorization",
    description: 'Use `JWT {Authorization Token}` for protected Formaloo API requests.'
  };
}
spec.components.responses.BadRequest = spec.components.responses.BadRequest ?? {
  description: "The request could not be processed. Review request parameters, headers, and payload values."
};
spec.components.responses.Unauthorized = spec.components.responses.Unauthorized ?? {
  description: "Authentication credentials are missing, invalid, or expired."
};
spec.components.responses.NotFound = spec.components.responses.NotFound ?? {
  description: "The requested resource could not be found."
};

const operationMetadata = metadata?.operations ?? {};
const allowedMetadataKeys = new Set([
  "stability",
  "audience",
  "recommended",
  "complexity",
  "statefulness"
]);
const legacySessionSecuritySchemes = new Set(["cookieAuth", "basicAuth"]);
const tagDefinitions = new Map();
const sortedPaths = {};
const httpMethods = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);

function titleizeTag(slug) {
  const overrides = {
    oauth2: "OAuth 2.0",
    oembed: "oEmbed"
  };

  if (overrides[slug]) {
    return overrides[slug];
  }

  return slug
    .replace(/[_-]+/g, " ")
    .replace(/\bapi\b/gi, "API")
    .replace(/\bai\b/gi, "AI")
    .replace(/\bnps\b/gi, "NPS")
    .replace(/\bgsheet\b/gi, "GSheet")
    .replace(/\bpdf\b/gi, "PDF")
    .replace(/\boauth\b/gi, "OAuth")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getTagDefinition(slug) {
  const tagInfo = tagMetadata[slug] ?? {};
  const displayName = tagInfo.displayName ?? titleizeTag(slug);

  return {
    name: displayName,
    description: tagInfo.description ?? `Operations for ${displayName.toLowerCase()}.`,
    "x-formaloo-tag-slug": slug
  };
}

function hasHeaderParameter(operation, headerName) {
  return (operation.parameters ?? []).some(
    (parameter) =>
      parameter?.in === "header" &&
      typeof parameter?.name === "string" &&
      parameter.name.toLowerCase() === headerName.toLowerCase()
  );
}

function upsertHeaderParameter(operation, parameter) {
  operation.parameters = operation.parameters ?? [];
  const existingParameter = operation.parameters.find(
    (currentParameter) =>
      currentParameter?.in === "header" &&
      typeof currentParameter?.name === "string" &&
      currentParameter.name.toLowerCase() === parameter.name.toLowerCase()
  );

  if (existingParameter) {
    existingParameter.description = parameter.description;
    existingParameter.required = parameter.required;
    existingParameter.schema = parameter.schema;
    return;
  }

  operation.parameters.push(parameter);
}

function ensureResponse(operation, statusCode, refName) {
  operation.responses = operation.responses ?? {};
  if (!operation.responses[statusCode]) {
    operation.responses[statusCode] = {
      $ref: `#/components/responses/${refName}`
    };
  }
}

function ensureResponseDescriptions(operation, method) {
  const defaults = {
    "200": "Successful response.",
    "201": "Resource created successfully.",
    "202": "Request accepted successfully.",
    "204": "No response body."
  };

  for (const [statusCode, response] of Object.entries(operation.responses ?? {})) {
    if (!response || "$ref" in response) {
      continue;
    }

    const description = typeof response.description === "string" ? response.description.trim() : "";
    if (description) {
      continue;
    }

    response.description =
      defaults[statusCode] ??
      (method === "delete" ? "Request completed successfully." : "Successful response.");
  }
}

function normalizeHeaderParameters(pathKey, method, operation) {
  for (const parameter of operation.parameters ?? []) {
    if (parameter?.in !== "header" || typeof parameter?.name !== "string") {
      continue;
    }

    const normalizedName = parameter.name.toLowerCase();

    if (normalizedName === "x-api-key") {
      parameter.description = apiKeyHeaderDescription;
    }

    if (normalizedName === "x-workspace") {
      parameter.description = workspaceHeaderDescription;
    }
  }

  if (pathKey === "/v3.0/oauth2/authorization-token/" && method === "post") {
    upsertHeaderParameter(operation, {
      in: "header",
      name: "Authorization",
      required: true,
      schema: { type: "string" },
      description: clientCredentialsAuthorizationDescription
    });
  }

  if (pathKey === "/v1.0/end-users/authorize/" && method === "post") {
    upsertHeaderParameter(operation, {
      in: "header",
      name: "Authorization",
      required: true,
      schema: { type: "string" },
      description: endUserSessionAuthorizationDescription
    });
  }

  if (pathKey === "/v3.0/form-displays/slug/{slug}/submit/" && method === "post") {
    upsertHeaderParameter(operation, {
      in: "header",
      name: "x-app-id",
      required: false,
      schema: { type: "string" },
      description: appIdHeaderDescription
    });
  }

  if (pathKey === "/v3.0/end-users/request-redirect/" && method === "post") {
    upsertHeaderParameter(operation, {
      in: "header",
      name: "x-scope",
      required: false,
      schema: { type: "string" },
      description: scopeHeaderDescription
    });
  }

  if (pathKey === "/v3.0/end-users/profile/" && method === "get") {
    upsertHeaderParameter(operation, {
      in: "header",
      name: "x-scope",
      required: false,
      schema: { type: "string" },
      description: scopeHeaderDescription
    });
  }
}

function getRefTarget(ref) {
  if (typeof ref !== "string" || !ref.startsWith("#/")) {
    return null;
  }

  const parts = ref.slice(2).split("/");
  let current = spec;
  for (const part of parts) {
    current = current?.[part];
    if (!current) {
      return null;
    }
  }

  return current;
}

function inferSchemaType(schema, seenRefs = new Set()) {
  if (!schema || typeof schema !== "object") {
    return null;
  }

  if (typeof schema.type === "string") {
    return schema.type;
  }

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return typeof schema.enum[0] === "string" ? "string" : null;
  }

  if (typeof schema.$ref === "string") {
    if (seenRefs.has(schema.$ref)) {
      return null;
    }

    const nextSeenRefs = new Set(seenRefs);
    nextSeenRefs.add(schema.$ref);
    return inferSchemaType(getRefTarget(schema.$ref), nextSeenRefs);
  }

  for (const key of ["allOf", "oneOf", "anyOf"]) {
    if (!Array.isArray(schema[key]) || schema[key].length === 0) {
      continue;
    }

    const inferredTypes = new Set(
      schema[key]
        .map((item) => inferSchemaType(item, seenRefs))
        .filter(Boolean)
    );

    if (inferredTypes.size === 1) {
      return Array.from(inferredTypes)[0];
    }
  }

  return null;
}

function normalizeSecurity(operation) {
  if (!Array.isArray(operation.security) || operation.security.length === 0) {
    return operation;
  }

  const knownSecuritySchemes = new Set(Object.keys(spec.components.securitySchemes ?? {}));
  let shouldUsePublicAuthModel = false;
  const filteredSecurity = [];

  for (const requirement of operation.security) {
    if (!requirement || typeof requirement !== "object") {
      continue;
    }

    const keys = Object.keys(requirement);
    if (keys.length === 0) {
      continue;
    }

    if (keys.every((key) => legacySessionSecuritySchemes.has(key))) {
      shouldUsePublicAuthModel = true;
      continue;
    }

    const safeRequirement = {};
    for (const key of keys) {
      if (knownSecuritySchemes.has(key)) {
        safeRequirement[key] = requirement[key];
      }
    }

    if (Object.keys(safeRequirement).length > 0) {
      filteredSecurity.push(safeRequirement);
    }
  }

  if (shouldUsePublicAuthModel) {
    filteredSecurity.push({
      ApiKeyAuthentication: [],
      JwtAuthentication: []
    });
  }

  if (filteredSecurity.length > 0) {
    operation.security = filteredSecurity;
  } else {
    delete operation.security;
  }

  return operation;
}

function normalizeResponses(pathKey, method, operation) {
  const responseCodes = Object.keys(operation.responses ?? {});
  const has4xxResponse = responseCodes.some((statusCode) => /^4\d\d$/.test(statusCode));
  const requiresAuth = Array.isArray(operation.security) && operation.security.length > 0;
  const hasApiKeyHeader = hasHeaderParameter(operation, "x-api-key");

  if (!has4xxResponse) {
    ensureResponse(operation, "400", "BadRequest");
  }

  if ((requiresAuth || hasApiKeyHeader) && !operation.responses?.["401"]) {
    ensureResponse(operation, "401", "Unauthorized");
  }

  if (pathKey.includes("{") && ["get", "put", "patch", "delete"].includes(method) && !operation.responses?.["404"]) {
    ensureResponse(operation, "404", "NotFound");
  }

  ensureResponseDescriptions(operation, method);
}

function normalizeSchemaTree(node) {
  if (!node || typeof node !== "object") {
    return;
  }

  if (node.nullable === true && typeof node.type !== "string") {
    const inferredType = inferSchemaType(node);
    if (inferredType) {
      node.type = inferredType;
    }
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        normalizeSchemaTree(item);
      }
    } else if (value && typeof value === "object") {
      normalizeSchemaTree(value);
    }
  }
}

function collectComponentUsage(rootNode) {
  const usedComponents = new Map();
  const visitedRefs = new Set();

  function mark(section, name) {
    if (!usedComponents.has(section)) {
      usedComponents.set(section, new Set());
    }
    usedComponents.get(section).add(name);
  }

  function walk(node) {
    if (!node || typeof node !== "object") {
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
      return;
    }

    if (typeof node.$ref === "string") {
      const ref = node.$ref;
      const match = ref.match(/^#\/components\/([^/]+)\/(.+)$/);
      if (match) {
        const [, section, name] = match;
        mark(section, name);

        if (!visitedRefs.has(ref)) {
          visitedRefs.add(ref);
          const target = spec.components?.[section]?.[name];
          if (target) {
            walk(target);
          }
        }
      }
    }

    for (const value of Object.values(node)) {
      walk(value);
    }
  }

  walk(rootNode);
  return usedComponents;
}

function pruneUnusedSchemas() {
  if (!spec.components?.schemas) {
    return;
  }

  const usedComponents = collectComponentUsage({
    paths: spec.paths,
    webhooks: spec.webhooks,
    components: {
      responses: spec.components.responses,
      parameters: spec.components.parameters,
      requestBodies: spec.components.requestBodies,
      headers: spec.components.headers,
      examples: spec.components.examples,
      links: spec.components.links,
      callbacks: spec.components.callbacks
    }
  });
  const usedSchemas = usedComponents.get("schemas") ?? new Set();

  for (const schemaName of Object.keys(spec.components.schemas)) {
    if (!usedSchemas.has(schemaName)) {
      delete spec.components.schemas[schemaName];
    }
  }
}

for (const pathKey of Object.keys(spec.paths).sort()) {
  const pathItem = spec.paths[pathKey];
  const sortedPathItem = {};
  const isLegacyPath = Boolean(publicContract.legacyPaths[pathKey]);

  for (const [method, operation] of Object.entries(pathItem)) {
    if (!httpMethods.has(method)) {
      sortedPathItem[method] = operation;
      continue;
    }

    const normalizedOperation = { ...operation };
    normalizeHeaderParameters(pathKey, method, normalizedOperation);
    normalizeSecurity(normalizedOperation);
    normalizeResponses(pathKey, method, normalizedOperation);

    const rawTags =
      Array.isArray(normalizedOperation.tags) && normalizedOperation.tags.length > 0
        ? normalizedOperation.tags
        : [pathKey.split("/").filter(Boolean)[1] ?? "general"];
    normalizedOperation.tags = Array.from(
      new Set(
        rawTags.map((tagSlug) => {
          const tagDefinition = getTagDefinition(tagSlug);
          tagDefinitions.set(tagDefinition.name, tagDefinition);
          return tagDefinition.name;
        })
      )
    );

    if (isLegacyPath) {
      const notice = publicContract.legacyPathNotice;
      const existingDescription = (normalizedOperation.description ?? "").trim();
      if (!existingDescription.startsWith(notice)) {
        normalizedOperation.description = existingDescription
          ? `${notice}\n\n${existingDescription}`
          : notice;
      }
      normalizedOperation["x-formaloo-legacy-path"] = true;
    }

    if (normalizedOperation.operationId && operationMetadata[normalizedOperation.operationId]) {
      const safeMetadata = {};
      for (const [key, value] of Object.entries(operationMetadata[normalizedOperation.operationId])) {
        if (allowedMetadataKeys.has(key)) {
          safeMetadata[key] = value;
        }
      }

      if (Object.keys(safeMetadata).length > 0) {
        normalizedOperation["x-formaloo-metadata"] = safeMetadata;
      }
    }

    sortedPathItem[method] = normalizedOperation;
  }

  sortedPaths[pathKey] = sortedPathItem;
}

spec.paths = sortedPaths;
spec.tags = Array.from(tagDefinitions.values()).sort((left, right) => left.name.localeCompare(right.name));
normalizeSchemaTree(spec.components?.schemas);
pruneUnusedSchemas();

await fs.mkdir(intermediateDir, { recursive: true });
await fs.writeFile(normalizedSpecPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");

console.log(`Normalized public spec -> ${path.relative(rootDir, normalizedSpecPath)}`);
