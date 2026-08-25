import fs from "node:fs/promises";
import path from "node:path";

// The formz `mcp-1.0` contract is still being rolled out and may temporarily
// omit operations the MCP artifact is required to expose. Until the upstream
// contract is complete, backfill those specific operations from the formz
// v3.0 bundle. Every backfilled operation is logged; when the upstream
// mcp-1.0 contract exposes them, this script becomes a no-op.
//
// Keep this list in sync with the required operation lists in
// scripts/validate-mcp-openapi.mjs (coreOperationIds,
// requiredMcpReadyOperationIds, requiredPatchUpdateOperationIds).
const requiredOperationIds = new Set([
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
]);

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const mergedSpecPath = path.join(rootDir, "artifacts", "intermediate", "openapi-merged.mcp.raw.json");
const fallbackBundlePath = path.join(rootDir, "spec", "formz-bundled.json");

const httpMethods = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);

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
  if (mergedOperations.has(operationId)) {
    continue;
  }

  const fallbackRecord = fallbackOperations.get(operationId);
  if (!fallbackRecord) {
    unavailable.push(operationId);
    continue;
  }

  const { pathKey, method, operation } = fallbackRecord;
  mergedSpec.paths = mergedSpec.paths ?? {};
  mergedSpec.paths[pathKey] = mergedSpec.paths[pathKey] ?? {};
  mergedSpec.paths[pathKey][method] = operation;
  const copiedComponents = copyMissingComponents(operation);
  backfilled.push(`${operationId} ${method.toUpperCase()} ${pathKey} (+${copiedComponents} component(s))`);
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
