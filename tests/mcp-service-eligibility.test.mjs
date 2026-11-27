import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("gateway agent operations publish automatically while auth and AI services stay excluded", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "formaloo-mcp-service-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  for (const dir of ["scripts", "spec", "artifacts/intermediate"]) {
    await mkdir(path.join(root, dir), {recursive: true});
  }
  for (const name of ["build-mcp-openapi.mjs", "request-context-contract.mjs"]) {
    await copyFile(new URL(`../scripts/${name}`, import.meta.url), path.join(root, "scripts", name));
  }
  await copyFile(new URL("../spec/mcp-openapi-settings.json", import.meta.url), path.join(root, "spec/mcp-openapi-settings.json"));
  const operation = (operationId) => ({
    operationId, summary: "Synthetic source operation", description: "Source-owned description.",
    security: [{GatewayKey: [], GatewayToken: []}],
    responses: {200: {description: "Saved result."}},
  });
  // This future operation is deliberately absent from every per-operation include list.
  const agentPath = "/v3.0/synthetic-agents/";
  const agent = {paths: {[agentPath]: {post: operation("syntheticAgentCreate")}}};
  const auth = {paths: {"/v3.0/synthetic-auth/": {post: operation("syntheticAuthCreate")}}};
  const ai = {paths: {"/v3.0/synthetic-ai/": {post: operation("syntheticAiCreate")}}};
  for (const [name, spec] of Object.entries({"agent-builder": agent, authentication: auth, ai})) {
    await writeFile(path.join(root, "spec", `${name}-bundled.json`), JSON.stringify(spec));
  }
  const input = {
    openapi: "3.0.3", info: {title: "Synthetic gateway", version: "1"},
    paths: {...agent.paths, ...auth.paths, ...ai.paths},
    components: {securitySchemes: {
      GatewayKey: {type: "apiKey", in: "header", name: "x-api-key"},
      GatewayToken: {type: "apiKey", in: "header", name: "Authorization"},
    }},
  };
  await writeFile(path.join(root, "artifacts/intermediate/openapi-mcp-source.normalized.json"), JSON.stringify(input));
  execFileSync(process.execPath, [path.join(root, "scripts/build-mcp-openapi.mjs")], {stdio: "pipe"});
  const output = JSON.parse(await readFile(path.join(root, "artifacts/intermediate/openapi-mcp.filtered.json"), "utf8"));
  assert.deepEqual(Object.keys(output.paths), [agentPath]);
  assert.equal(output.paths[agentPath].post.operationId, "syntheticAgentCreate");
  assert.deepEqual(output.paths[agentPath].post.security, agent.paths[agentPath].post.security);
  assert.deepEqual(output.components.securitySchemes, input.components.securitySchemes);
});
