import fs from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const defaultSpecPath = path.join(rootDir, "artifacts", "intermediate", "openapi-mcp.filtered.json");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const specPathInput = args.find((arg) => arg !== "--dry-run") || defaultSpecPath;
const specPath = path.isAbsolute(specPathInput) ? specPathInput : path.join(rootDir, specPathInput);

function decodePointerSegment(segment) {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function pointerParts(ref) {
  const hashIndex = ref.indexOf("#");
  const fragment = hashIndex === -1 ? ref : ref.slice(hashIndex + 1);

  if (!fragment.startsWith("/")) {
    return [];
  }

  return fragment
    .slice(1)
    .split("/")
    .map(decodePointerSegment);
}

function readPointer(root, parts) {
  let current = root;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }

    current = current[part];
  }

  return current;
}

function getReferencedSchemaName(ref) {
  const parts = pointerParts(ref);

  if (parts[0] === "components" && parts[1] === "schemas" && parts[2]) {
    return parts[2];
  }

  return null;
}

const spec = JSON.parse(await fs.readFile(specPath, "utf8"));

if (!spec || typeof spec !== "object") {
  throw new Error(`Unable to parse OpenAPI spec at ${specPath}`);
}

const schemas = spec.components?.schemas;
if (!schemas || typeof schemas !== "object") {
  console.log("No component schemas to prune.");
  process.exit(0);
}

const usedSchemas = new Set();
const visitedSchemas = new Set();
const visitedRefs = new Set();

function visit(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      visit(item);
    }
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const ref = value.$ref;
  if (typeof ref === "string" && ref.startsWith("#/")) {
    const schemaName = getReferencedSchemaName(ref);
    if (schemaName) {
      usedSchemas.add(schemaName);

      if (!visitedSchemas.has(schemaName)) {
        visitedSchemas.add(schemaName);
        visit(schemas[schemaName]);
      }
    } else if (!visitedRefs.has(ref)) {
      visitedRefs.add(ref);
      visit(readPointer(spec, pointerParts(ref)));
    }
  }

  for (const item of Object.values(value)) {
    visit(item);
  }
}

visit(spec.paths ?? {});

const beforeCount = Object.keys(schemas).length;
for (const schemaName of Object.keys(schemas)) {
  if (!usedSchemas.has(schemaName)) {
    delete schemas[schemaName];
  }
}

const removedCount = beforeCount - Object.keys(schemas).length;
if (!dryRun) {
  await fs.writeFile(
    specPath,
    `${JSON.stringify(spec, null, 2)}\n`,
    "utf8"
  );
}

console.log(`${dryRun ? "Would prune" : "Pruned"} unused MCP schemas: ${removedCount}`);
