import fs from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const artifactsDir = path.join(rootDir, "artifacts");
const intermediateDir = path.join(artifactsDir, "intermediate");
const rawSpecPath = path.join(intermediateDir, "openapi-merged.raw.json");
const normalizedSpecPath = path.join(intermediateDir, "openapi-public.normalized.json");
const publicContractPath = path.join(rootDir, "spec", "public-contract.json");
const metadataPath = path.join(rootDir, "spec", "operation-metadata.json");

const publicContract = JSON.parse(await fs.readFile(publicContractPath, "utf8"));
const spec = JSON.parse(await fs.readFile(rawSpecPath, "utf8"));

let metadata = null;
try {
  metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
} catch {
  metadata = null;
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
if (!spec.components.securitySchemes.ApiKeyAuthentication) {
  spec.components.securitySchemes.ApiKeyAuthentication = {
    type: "apiKey",
    in: "header",
    name: "x-api-key",
    description: "Application API key required for Formaloo public API requests."
  };
}
if (!spec.components.securitySchemes.JwtAuthentication) {
  spec.components.securitySchemes.JwtAuthentication = {
    type: "apiKey",
    in: "header",
    name: "Authorization",
    description: 'Token-based authentication with required prefix "JWT"'
  };
}

const operationMetadata = metadata?.operations ?? {};
const allowedMetadataKeys = new Set([
  "stability",
  "audience",
  "recommended",
  "complexity",
  "statefulness"
]);
const legacySessionSecuritySchemes = new Set(["cookieAuth", "basicAuth"]);
const tagNames = new Set();
const sortedPaths = {};
const httpMethods = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);

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
    normalizeSecurity(normalizedOperation);

    if (!Array.isArray(normalizedOperation.tags) || normalizedOperation.tags.length === 0) {
      const firstSegment = pathKey.split("/").filter(Boolean)[1] ?? "general";
      normalizedOperation.tags = [firstSegment];
    }

    for (const tag of normalizedOperation.tags) {
      tagNames.add(tag);
    }

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
spec.tags = Array.from(tagNames)
  .sort((left, right) => left.localeCompare(right))
  .map((name) => ({ name }));
normalizeSchemaTree(spec.components?.schemas);

await fs.mkdir(intermediateDir, { recursive: true });
await fs.writeFile(normalizedSpecPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");

console.log(`Normalized public spec -> ${path.relative(rootDir, normalizedSpecPath)}`);
