import fs from "node:fs/promises";
import path from "node:path";

// The formz `mcp-1.0` contract is still being rolled out and may temporarily
// omit operations the MCP artifact is required to expose. Until the upstream
// contract is complete, backfill those specific operations from the formz
// v3.0 bundle. Every backfilled operation is logged; when the upstream
// mcp-1.0 contract exposes them, this script becomes a no-op.
//
// Keep this built-in list in sync with the required operation lists in
// scripts/validate-mcp-openapi.mjs (coreOperationIds,
// requiredMcpReadyOperationIds, requiredPatchUpdateOperationIds). Additional
// policy compatibility operations live in spec/mcp-openapi-settings.json so
// backfill, filtering, and validation share one source of truth.
const baseRequiredOperationIds = [
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
  "formsRowsCreate",
  "themesList",
  "themesCreate",
  "themesRetrieve",
  "themesPartialUpdate",
  "fieldsPartialUpdate",
  "formFieldsPartialUpdate"
];

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const mergedSpecPath = path.join(rootDir, "artifacts", "intermediate", "openapi-merged.mcp.raw.json");
const fallbackBundlePath = path.join(rootDir, "spec", "formz-bundled.json");
const settingsPath = path.join(rootDir, "spec", "mcp-openapi-settings.json");

const settings = JSON.parse(await fs.readFile(settingsPath, "utf8"));
const configuredRequiredOperationIds = Array.isArray(settings.requiredOperationIds)
  ? settings.requiredOperationIds.map((value) => String(value).trim()).filter(Boolean)
  : [];
const includedOperationIds = Array.isArray(settings.includeOperationIds)
  ? settings.includeOperationIds.map((value) => String(value).trim()).filter(Boolean)
  : [];
const requiredOperationIds = new Set([
  ...baseRequiredOperationIds,
  ...configuredRequiredOperationIds,
  ...includedOperationIds
]);

const httpMethods = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);
const includeOperationIdAliases = settings.includeOperationIdAliases ?? {};

function asStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function operationIdGroup(operationId) {
  const extras = includeOperationIdAliases[operationId];
  if (Array.isArray(extras)) {
    return [operationId, ...asStringArray(extras)];
  }

  for (const [primary, ids] of Object.entries(includeOperationIdAliases)) {
    if (asStringArray(ids).includes(operationId)) {
      return [primary, ...asStringArray(ids)];
    }
  }

  return [operationId];
}

const mergedSpec = JSON.parse(await fs.readFile(mergedSpecPath, "utf8"));

let fallbackSpec = null;
try {
  fallbackSpec = JSON.parse(await fs.readFile(fallbackBundlePath, "utf8"));
} catch (error) {
  if (error?.code === "ENOENT") {
    console.warn(`Backfill source ${path.relative(rootDir, fallbackBundlePath)} not found; skipping backfill.`);
    process.exit(0);
  }
  throw error;
}

function indexOperations(spec) {
  const index = new Map();
  for (const [pathKey, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") {
      continue;
    }

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!httpMethods.has(method) || !operation || typeof operation !== "object") {
        continue;
      }

      if (typeof operation.operationId === "string" && operation.operationId.trim() !== "") {
        index.set(operation.operationId, { pathKey, method, operation });
      }
    }
  }
  return index;
}

function collectRefs(node, refs = new Set()) {
  if (!node || typeof node !== "object") {
    return refs;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectRefs(item, refs);
    }
    return refs;
  }

  if (typeof node.$ref === "string" && node.$ref.startsWith("#/components/")) {
    refs.add(node.$ref);
  }

  for (const value of Object.values(node)) {
    collectRefs(value, refs);
  }

  return refs;
}

// Copies components referenced by a backfilled operation from the fallback
// bundle when the merged spec does not already define them. Existing
// components are never overwritten, so shared schema names keep resolving to
// the mcp-1.0 definitions.
function copyMissingComponents(startNode) {
  const pending = [...collectRefs(startNode)];
  const seen = new Set(pending);
  let copied = 0;

  while (pending.length > 0) {
    const ref = pending.pop();
    const match = ref.match(/^#\/components\/([^/]+)\/(.+)$/);
    if (!match) {
      continue;
    }

    const [, section, name] = match;
    const existing = mergedSpec.components?.[section]?.[name];
    const source = fallbackSpec.components?.[section]?.[name];

    if (!existing && source) {
      mergedSpec.components = mergedSpec.components ?? {};
      mergedSpec.components[section] = mergedSpec.components[section] ?? {};
      mergedSpec.components[section][name] = source;
      copied += 1;
    }

    const target = existing ?? source;
    for (const nestedRef of collectRefs(target)) {
      if (!seen.has(nestedRef)) {
        seen.add(nestedRef);
        pending.push(nestedRef);
      }
    }
  }

  return copied;
}

const mergedOperations = indexOperations(mergedSpec);
const fallbackOperations = indexOperations(fallbackSpec);

const backfilled = [];
const unavailable = [];

for (const operationId of requiredOperationIds) {
  const group = operationIdGroup(operationId);
  if (group.some((candidateId) => mergedOperations.has(candidateId))) {
    continue;
  }

  let fallbackId = null;
  let fallbackRecord = null;
  for (const candidateId of group) {
    fallbackRecord = fallbackOperations.get(candidateId);
    if (fallbackRecord) {
      fallbackId = candidateId;
      break;
    }
  }
  if (!fallbackRecord) {
    unavailable.push(operationId);
    continue;
  }

  const { pathKey, method, operation } = fallbackRecord;
  mergedSpec.paths = mergedSpec.paths ?? {};
  mergedSpec.paths[pathKey] = mergedSpec.paths[pathKey] ?? {};
  mergedSpec.paths[pathKey][method] = operation;
  const copiedComponents = copyMissingComponents(operation);
  backfilled.push(`${fallbackId} ${method.toUpperCase()} ${pathKey} (+${copiedComponents} component(s))`);
}

if (backfilled.length > 0) {
  await fs.writeFile(mergedSpecPath, `${JSON.stringify(mergedSpec, null, 2)}\n`, "utf8");
  console.warn(
    `Backfilled ${backfilled.length} required MCP operation(s) missing from the formz mcp-1.0 contract using the formz v3.0 bundle:\n- ${backfilled.join("\n- ")}`
  );
} else {
  console.log("No MCP operation backfill needed; the mcp-1.0 contract exposes all required operations.");
}

if (unavailable.length > 0) {
  console.warn(
    `Required operations missing from both the mcp-1.0 merge and the formz v3.0 bundle (validation will fail): ${unavailable.join(", ")}`
  );
}
