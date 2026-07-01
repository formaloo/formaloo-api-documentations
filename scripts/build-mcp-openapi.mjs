import fs from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const intermediateDir = path.join(rootDir, "artifacts", "intermediate");
const normalizedSpecPath = path.join(intermediateDir, "openapi-public.normalized.json");
const mcpSpecPath = path.join(intermediateDir, "openapi-mcp.filtered.json");
const defaultSettingsPath = path.join(rootDir, "spec", "mcp-openapi-settings.json");

const httpMethods = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);

function asStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeServiceToken(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeServiceName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function stripServerPrefix(rawPath) {
  const withoutQuery = String(rawPath ?? "").split("?")[0].split("#")[0];
  return withoutQuery.replace(/^https?:\/\/[^/]+/i, "");
}

function normalizePathForCompare(rawPath) {
  let normalized = stripServerPrefix(rawPath).trim();
  if (!normalized) {
    return "/";
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/+/g, "/").toLowerCase();
  normalized = normalized.replace(/\{([^}]+)\}/g, "$1");

  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/, "");
  }

  return normalized;
}

function stripVersionPrefix(normalizedPath) {
  const withoutVersion = normalizedPath.replace(/^\/v\d+\.\d+(?=\/|$)/, "");
  return withoutVersion || "/";
}

function hasVersionPrefix(normalizedPath) {
  return /^\/v\d+\.\d+(?=\/|$)/.test(normalizedPath);
}

function preparePathRule(rawPath) {
  const pathValue = normalizePathForCompare(rawPath);
  return {
    path: pathValue,
    includesVersion: hasVersionPrefix(pathValue)
  };
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function wildcardPatternToRegex(pattern) {
  const escapedPattern = escapeRegex(pattern).replace(/\*/g, ".*");
  return new RegExp(`^${escapedPattern}(?:/.*)?$`);
}

function prepareWildcardRule(rawPattern) {
  const pathValue = normalizePathForCompare(rawPattern);
  return {
    pattern: pathValue,
    includesVersion: hasVersionPrefix(pathValue),
    regex: wildcardPatternToRegex(pathValue)
  };
}

async function loadServiceExclusionIndex(serviceNames) {
  const operationIds = new Set();
  const endpointKeys = new Set();
  const missingServices = [];

  for (const serviceName of serviceNames) {
    const normalizedServiceName = normalizeServiceName(serviceName);
    const bundledPath = path.join(rootDir, "spec", `${normalizedServiceName}-bundled.json`);

    let serviceSpec = null;
    try {
      serviceSpec = JSON.parse(await fs.readFile(bundledPath, "utf8"));
    } catch (error) {
      if (error?.code === "ENOENT") {
        missingServices.push(serviceName);
        continue;
      }
      throw error;
    }

    for (const [pathKey, pathItem] of Object.entries(serviceSpec.paths ?? {})) {
      for (const [method, operation] of Object.entries(pathItem ?? {})) {
        const methodToken = method.toLowerCase();
        if (!httpMethods.has(methodToken) || !operation || typeof operation !== "object") {
          continue;
        }

        if (typeof operation.operationId === "string" && operation.operationId.trim() !== "") {
          operationIds.add(operation.operationId);
        }

        const normalizedPath = normalizePathForCompare(pathKey);
        const versionlessPath = stripVersionPrefix(normalizedPath);
        endpointKeys.add(`${methodToken} ${normalizedPath}`);
        endpointKeys.add(`${methodToken} ${versionlessPath}`);
      }
    }
  }

  return {
    operationIds,
    endpointKeys,
    missingServices
  };
}

const settingsPathInput = defaultSettingsPath;
const settingsPath = path.isAbsolute(settingsPathInput) ? settingsPathInput : path.join(rootDir, settingsPathInput);

let settings = {};
try {
  settings = JSON.parse(await fs.readFile(settingsPath, "utf8"));
} catch (error) {
  if (error?.code !== "ENOENT") {
    throw error;
  }
}

const excludeSettings = settings.exclude ?? settings;
const excludedServices = asStringArray(excludeSettings.services);
const excludedServiceTokens = new Set(excludedServices.map(normalizeServiceToken));
const excludedTagTokens = new Set(asStringArray(excludeSettings.tags).map(normalizeServiceToken));
const excludedPathPrefixes = asStringArray(excludeSettings.pathPrefixes).map(preparePathRule);
const excludedPathPatterns = asStringArray(excludeSettings.pathPatterns).map(prepareWildcardRule);
const excludedEndpoints = new Set(asStringArray(excludeSettings.endpoints).map((endpoint) => normalizePathForCompare(endpoint)));
const excludedServiceIndex = await loadServiceExclusionIndex(excludedServices);

const spec = JSON.parse(await fs.readFile(normalizedSpecPath, "utf8"));

const displayNameToSlug = new Map();
for (const tag of spec.tags ?? []) {
  if (!tag || typeof tag.name !== "string") {
    continue;
  }

  const slug = typeof tag["x-formaloo-tag-slug"] === "string" ? tag["x-formaloo-tag-slug"] : null;
  if (slug) {
    displayNameToSlug.set(tag.name, slug);
  }
}

function operationHasExcludedTag(operation) {
  if (excludedTagTokens.size === 0) {
    return false;
  }

  for (const tagName of operation.tags ?? []) {
    const displayToken = normalizeServiceToken(tagName);
    if (excludedTagTokens.has(displayToken)) {
      return true;
    }

    const slug = displayNameToSlug.get(tagName);
    if (slug && excludedTagTokens.has(normalizeServiceToken(slug))) {
      return true;
    }
  }

  return false;
}

function shouldExcludeByService(pathKey, method, operation) {
  if (excludedServices.length === 0) {
    return false;
  }

  if (typeof operation?.operationId === "string" && excludedServiceIndex.operationIds.has(operation.operationId)) {
    return true;
  }

  const methodToken = method.toLowerCase();
  const normalizedPath = normalizePathForCompare(pathKey);
  const versionlessPath = stripVersionPrefix(normalizedPath);
  if (
    excludedServiceIndex.endpointKeys.has(`${methodToken} ${normalizedPath}`) ||
    excludedServiceIndex.endpointKeys.has(`${methodToken} ${versionlessPath}`)
  ) {
    return true;
  }

  return false;
}

function pathMatchesRule(pathKey, includesVersion, value, matcher) {
  const normalizedPath = normalizePathForCompare(pathKey);
  const versionlessPath = stripVersionPrefix(normalizedPath);
  const targetPath = includesVersion ? normalizedPath : versionlessPath;
  return matcher(targetPath, value);
}

function shouldExcludeByPathPrefix(pathKey) {
  return excludedPathPrefixes.some(({ path: prefix, includesVersion }) =>
    pathMatchesRule(pathKey, includesVersion, prefix, (candidate, rulePath) => {
      if (rulePath === "/") {
        return true;
      }

      if (candidate === rulePath) {
        return true;
      }

      return candidate.startsWith(`${rulePath}/`);
    })
  );
}

function shouldExcludeByWildcard(pathKey) {
  return excludedPathPatterns.some(({ includesVersion, regex }) =>
    pathMatchesRule(pathKey, includesVersion, regex, (candidate, ruleRegex) => ruleRegex.test(candidate))
  );
}

function shouldExcludeEndpoint(pathKey) {
  if (excludedEndpoints.size === 0) {
    return false;
  }

  const normalizedPath = normalizePathForCompare(pathKey);
  const versionlessPath = stripVersionPrefix(normalizedPath);
  return excludedEndpoints.has(normalizedPath) || excludedEndpoints.has(versionlessPath);
}

function shouldExcludePath(pathKey) {
  return shouldExcludeByPathPrefix(pathKey) || shouldExcludeByWildcard(pathKey) || shouldExcludeEndpoint(pathKey);
}

function getRefTarget(openapiSpec, ref) {
  if (typeof ref !== "string" || !ref.startsWith("#/")) {
    return null;
  }

  const parts = ref.slice(2).split("/");
  let current = openapiSpec;
  for (const part of parts) {
    current = current?.[part];
    if (!current) {
      return null;
    }
  }

  return current;
}

function relaxWorkspaceHeaderParameter(openapiSpec, parameter) {
  if (!parameter || typeof parameter !== "object") {
    return;
  }

  let target = parameter;
  if (typeof parameter.$ref === "string") {
    target = getRefTarget(openapiSpec, parameter.$ref);
  }

  if (
    target?.in === "header" &&
    typeof target.name === "string" &&
    target.name.toLowerCase() === "x-workspace"
  ) {
    target.required = false;
  }
}

function relaxWorkspaceHeaderRequirements(openapiSpec) {
  for (const pathItem of Object.values(openapiSpec.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") {
      continue;
    }

    for (const parameter of pathItem.parameters ?? []) {
      relaxWorkspaceHeaderParameter(openapiSpec, parameter);
    }

    for (const method of httpMethods) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== "object") {
        continue;
      }

      for (const parameter of operation.parameters ?? []) {
        relaxWorkspaceHeaderParameter(openapiSpec, parameter);
      }
    }
  }

  for (const parameter of Object.values(openapiSpec.components?.parameters ?? {})) {
    relaxWorkspaceHeaderParameter(openapiSpec, parameter);
  }
}

const filteredPaths = {};
const usedTagNames = new Set();
let removedOperations = 0;

for (const [pathKey, pathItem] of Object.entries(spec.paths ?? {})) {
  if (!pathItem || typeof pathItem !== "object") {
    continue;
  }

  const nextPathItem = {};
  const pathExcluded = shouldExcludePath(pathKey);

  for (const [method, operation] of Object.entries(pathItem)) {
    if (!httpMethods.has(method)) {
      nextPathItem[method] = operation;
      continue;
    }

    if (pathExcluded || shouldExcludeByService(pathKey, method, operation) || operationHasExcludedTag(operation)) {
      removedOperations += 1;
      continue;
    }

    nextPathItem[method] = operation;
    for (const tagName of operation.tags ?? []) {
      usedTagNames.add(tagName);
    }
  }

  const hasOperation = Object.keys(nextPathItem).some((key) => httpMethods.has(key));
  if (hasOperation) {
    filteredPaths[pathKey] = nextPathItem;
  }
}

spec.paths = filteredPaths;
spec.tags = (spec.tags ?? []).filter((tag) => typeof tag?.name === "string" && usedTagNames.has(tag.name));
relaxWorkspaceHeaderRequirements(spec);

await fs.mkdir(intermediateDir, { recursive: true });
await fs.writeFile(mcpSpecPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");

console.log(`MCP filtered spec -> ${path.relative(rootDir, mcpSpecPath)}`);
console.log(`MCP settings file -> ${path.relative(rootDir, settingsPath)}`);
if (excludedServiceIndex.missingServices.length > 0) {
  console.log(`Unknown services in settings: ${excludedServiceIndex.missingServices.join(", ")}`);
}
console.log(`Removed operations: ${removedOperations}`);
console.log(`Remaining paths: ${Object.keys(spec.paths ?? {}).length}`);
