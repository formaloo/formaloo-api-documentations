import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const httpMethods = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);

// Upstream OpenAPI often ships a summary and omits the operation description.
// spec/docs/v3.0/ already holds that prose. Path parameters use the parameter
// name in snake_case, and the file name is the lowercase HTTP method.
export function parameterSegment(name) {
  return String(name).replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

export function operationDocPath(docsRoot, apiPath, method) {
  if (typeof apiPath !== "string" || !apiPath.startsWith("/v3.0/")) {
    return null;
  }

  const relative = apiPath.slice("/v3.0/".length).replace(/^\/+|\/+$/g, "");
  const segments = relative === ""
    ? []
    : relative.split("/").map((segment) => {
      const match = segment.match(/^\{(.+)\}$/);
      return match ? parameterSegment(match[1]) : segment;
    });

  return path.join(docsRoot, ...segments, `${String(method).toLowerCase()}.md`);
}

function hasDescription(operation) {
  return typeof operation.description === "string" && operation.description.trim() !== "";
}

export async function applyLocalOperationDocs(spec, docsRoot, readFile = fs.readFile) {
  let applied = 0;

  for (const [apiPath, pathItem] of Object.entries(spec?.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") {
      continue;
    }

    for (const method of httpMethods) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== "object" || hasDescription(operation)) {
        continue;
      }
      if (operation.description !== undefined && typeof operation.description !== "string") {
        continue;
      }

      const docPath = operationDocPath(docsRoot, apiPath, method);
      if (!docPath) {
        continue;
      }

      let contents;
      try {
        contents = await readFile(docPath, "utf8");
      } catch (error) {
        if (error?.code === "ENOENT") {
          continue;
        }
        throw error;
      }

      const description = contents.trim();
      if (!description) {
        continue;
      }

      operation.description = description;
      applied += 1;
    }
  }

  return applied;
}

async function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const docsRoot = path.join(rootDir, "spec", "docs", "v3.0");
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.error("Usage: node scripts/apply-local-operation-docs.mjs <openapi.json>...");
    process.exit(1);
  }

  for (const file of files) {
    const specPath = path.isAbsolute(file) ? file : path.join(rootDir, file);
    let raw;
    try {
      raw = await fs.readFile(specPath, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") {
        console.warn(`Skipping missing spec: ${file}`);
        continue;
      }
      throw error;
    }

    const spec = JSON.parse(raw);
    const applied = await applyLocalOperationDocs(spec, docsRoot);
    if (applied > 0) {
      await fs.writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");
    }
    console.log(
      `Applied ${applied} local operation description(s) to ${path.relative(rootDir, specPath)}`
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
