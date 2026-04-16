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

if (spec.info?.externalDocs) {
  errors.push("OpenAPI info.externalDocs should not be present in the final normalized spec.");
}

if (!spec.externalDocs) {
  warnings.push("Final normalized spec does not define top-level externalDocs.");
}

if (!Array.isArray(spec.tags) || spec.tags.length === 0) {
  errors.push("Final normalized spec must define at least one top-level tag.");
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
