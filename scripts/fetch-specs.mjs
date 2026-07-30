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
      "formz-mcp": "https://api.staging.formaloo.com/docs/openapi/yaml/?version=mcp-1.0",
      authentication: "https://auth.staging.formaloo.com/docs/openapi/yaml?version=3.0",
      storage: "https://storage.staging.formaloo.com/docs/openapi/yaml/?version=3.0",
      ai: "https://ai.staging.formaloo.com/docs/openapi/yaml/?version=3.0"
    }
  : {
      icas: "https://id.formaloo.com/docs/openapi/yaml/?version=3.0",
      formz: "https://api.formaloo.me/docs/openapi/yaml/?version=3.0",
      "formz-mcp": "https://api.formaloo.me/docs/openapi/yaml/?version=mcp-1.0",
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
    "--retry-all-errors",
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

  const http1FallbackExitCodes = new Set([
    16, // HTTP/2 framing layer error
    52, // empty reply from server
    56, // failure receiving network data
    92 // HTTP/2 stream error
  ]);

  try {
    execFileSync("curl", commonArgs, { stdio: "inherit" });
    return;
  } catch (error) {
    if (!http1FallbackExitCodes.has(error.status)) {
      throw error;
    }
  }

  execFileSync("curl", ["--http1.1", ...commonArgs], { stdio: "inherit" });
}

// The mcp-1.0 contract references docs/mcp-1.0/*.md description files, but the
// endpoint descriptions are maintained once under spec/docs/v3.0/. Rewrite the
// references so the MCP build reads the same markdown files as the v3.0 build.
async function rewriteMcpDocRefs(outputPath) {
  const contents = await fs.readFile(outputPath, "utf8");
  const rewritten = contents.replaceAll("docs/mcp-1.0/", "docs/v3.0/");
  if (rewritten !== contents) {
    await fs.writeFile(outputPath, rewritten, "utf8");
    console.log(`Rewrote docs/mcp-1.0/ references to docs/v3.0/ in ${path.relative(rootDir, outputPath)}`);
  }
}

for (const [name, url] of Object.entries(sources)) {
  const outputPath = path.join(specDir, `${name}.yaml`);
  fetchSpec(outputPath, url);

  if (name === "formz-mcp") {
    await rewriteMcpDocRefs(outputPath);
  }

  console.log(`Fetched ${name} spec -> ${path.relative(rootDir, outputPath)}`);
}
