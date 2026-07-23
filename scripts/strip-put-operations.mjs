import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const specDir = path.join(rootDir, "spec");

// PUT operations are intentionally dropped from every generated document. Clients
// are expected to use PATCH for update requests, so PUT is stripped at the source
// specs before bundling, normalization, doc-stub generation, and MCP filtering.
const specFiles = [
  "icas.yaml",
  "formz.yaml",
  "authentication.yaml",
  "storage.yaml",
  "ai.yaml",
  "v3.0.yaml"
];

const operationMethods = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
  "trace"
]);

let totalRemovedOperations = 0;
let totalRemovedPaths = 0;

for (const fileName of specFiles) {
  const filePath = path.join(specDir, fileName);

  let contents;
  try {
    contents = await fs.readFile(filePath, "utf8");
  } catch (error) {
    console.warn(`Skipping PUT strip for ${fileName}: ${error.message}`);
    continue;
  }

  const document = yaml.load(contents);
  if (!document || typeof document !== "object" || !document.paths || typeof document.paths !== "object") {
    continue;
  }

  let removedOperations = 0;
  let removedPaths = 0;

  for (const [pathKey, pathItem] of Object.entries(document.paths)) {
    if (!pathItem || typeof pathItem !== "object") {
      continue;
    }

    if ("put" in pathItem) {
      delete pathItem.put;
      removedOperations += 1;
    }

    const hasRemainingOperation = Object.keys(pathItem).some((key) => operationMethods.has(key));
    if (!hasRemainingOperation) {
      delete document.paths[pathKey];
      removedPaths += 1;
    }
  }

  if (removedOperations === 0) {
    continue;
  }

  await fs.writeFile(filePath, yaml.dump(document, { lineWidth: -1, noRefs: true }), "utf8");
  totalRemovedOperations += removedOperations;
  totalRemovedPaths += removedPaths;

  console.log(
    `Stripped ${removedOperations} PUT operation(s) from ${fileName}` +
      (removedPaths > 0 ? ` (removed ${removedPaths} now-empty path item(s))` : "")
  );
}

console.log(
  `Removed ${totalRemovedOperations} PUT operation(s) across ${specFiles.length} source spec(s); ${totalRemovedPaths} path item(s) dropped.`
);
