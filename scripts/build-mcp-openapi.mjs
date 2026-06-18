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
  return new RegExp(`^${escapedPattern}$`);
}

function prepareWildcardRule(rawPattern) {
  const pathValue = normalizePathForCompare(rawPattern);
  return {
    pattern: pathValue,
    includesVersion: hasVersionPrefix(pathValue),
    regex: wildcardPatternToRegex(pathValue)
  };
}

const settingsPathInput = process.env.MCP_OPENAPI_SETTINGS_FILE || defaultSettingsPath;
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
const excludedServices = new Set(asStringArray(excludeSettings.services).map(normalizeServiceToken));
const excludedPathPrefixes = asStringArray(excludeSettings.pathPrefixes).map(preparePathRule);
const excludedPathPatterns = asStringArray(excludeSettings.pathPatterns).map(prepareWildcardRule);
const excludedEndpoints = new Set(asStringArray(excludeSettings.endpoints).map((endpoint) => normalizePathForCompare(endpoint)));

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

function operationHasExcludedService(operation) {
  if (excludedServices.size === 0) {
    return false;
  }

  for (const tagName of operation.tags ?? []) {
    const displayToken = normalizeServiceToken(tagName);
    if (excludedServices.has(displayToken)) {
      return true;
    }

    const slug = displayNameToSlug.get(tagName);
    if (slug && excludedServices.has(normalizeServiceToken(slug))) {
      return true;
    }
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

    if (pathExcluded || operationHasExcludedService(operation)) {
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

await fs.mkdir(intermediateDir, { recursive: true });
await fs.writeFile(mcpSpecPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");

console.log(`MCP filtered spec -> ${path.relative(rootDir, mcpSpecPath)}`);
console.log(`MCP settings file -> ${path.relative(rootDir, settingsPath)}`);
console.log(`Removed operations: ${removedOperations}`);
console.log(`Remaining paths: ${Object.keys(spec.paths ?? {}).length}`);
