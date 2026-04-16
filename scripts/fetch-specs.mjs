import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const specDir = path.join(rootDir, "spec");
const staging = process.env.STAGING_DOCS === "true";

const sources = staging
  ? {
      icas: "https://id.staging.formaloo.com/docs/openapi/yaml/?version=3.0",
      formz: "https://api.staging.formaloo.com/docs/openapi/yaml/?version=3.0",
      authentication: "https://auth.staging.formaloo.com/docs/openapi/yaml?version=3.0",
      storage: "https://storage.staging.formaloo.com/docs/openapi/yaml/?version=3.0",
      ai: "https://ai.staging.formaloo.com/docs/openapi/yaml/?version=3.0"
    }
  : {
      icas: "https://id.formaloo.com/docs/openapi/yaml/?version=3.0",
      formz: "https://api.formaloo.me/docs/openapi/yaml/?version=3.0",
      authentication: "https://auth.formaloo.me/docs/openapi/yaml?version=3.0",
      storage: "https://storage.formaloo.me/docs/openapi/yaml/?version=3.0",
      ai: "https://ai-api.formaloo.co/docs/openapi/yaml/?version=3.0"
    };

await fs.mkdir(specDir, { recursive: true });

function fetchSpec(outputPath, url) {
  const commonArgs = [
    "--fail",
    "--location",
    "--silent",
    "--show-error",
    "--retry",
    "4",
    "--retry-delay",
    "2",
    "--connect-timeout",
    "15",
    "--max-time",
    "90",
    "--output",
    outputPath,
    url
  ];

  try {
    execFileSync("curl", commonArgs, { stdio: "inherit" });
    return;
  } catch (error) {
    if (error.status !== 16) {
      throw error;
    }
  }

  execFileSync("curl", ["--http1.1", ...commonArgs], { stdio: "inherit" });
}

for (const [name, url] of Object.entries(sources)) {
  const outputPath = path.join(specDir, `${name}.yaml`);
  fetchSpec(outputPath, url);

  console.log(`Fetched ${name} spec -> ${path.relative(rootDir, outputPath)}`);
}
