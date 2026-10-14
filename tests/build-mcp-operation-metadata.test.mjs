import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const runFile = promisify(execFile);
const sourceRoot = new URL("../", import.meta.url);
const fixture = JSON.parse(await fs.readFile(new URL("fixtures/mcp-operation-metadata.json", import.meta.url), "utf8"));
const coveredOperations = [
  { path: "/forms/{slug}/", method: "patch" },
  { path: "/fields/ai-box/", method: "post" }
];

async function buildArtifact(t, source) {
  // Run the publisher entry point, with its real settings, in a disposable tree.
  // Each test owns its input/output so it never overwrites fetched build artifacts.
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-metadata-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "scripts"));
  await fs.mkdir(path.join(root, "spec"));
  await fs.mkdir(path.join(root, "artifacts", "intermediate"), { recursive: true });
  await fs.copyFile(new URL("scripts/request-context-contract.mjs", sourceRoot), path.join(root, "scripts", "request-context-contract.mjs"));
  await fs.copyFile(new URL("scripts/build-mcp-openapi.mjs", sourceRoot), path.join(root, "scripts", "build-mcp-openapi.mjs"));
  await fs.copyFile(new URL("spec/mcp-openapi-settings.json", sourceRoot), path.join(root, "spec", "mcp-openapi-settings.json"));
  await fs.writeFile(path.join(root, "artifacts", "intermediate", "openapi-mcp-source.normalized.json"), JSON.stringify(source));
  await runFile(process.execPath, [path.join(root, "scripts", "build-mcp-openapi.mjs")]);
  return JSON.parse(await fs.readFile(path.join(root, "artifacts", "intermediate", "openapi-mcp.filtered.json"), "utf8"));
}

test("publishes backend metadata verbatim while retaining MCP enrichment", async (t) => {
  const artifact = await buildArtifact(t, fixture);
  assert.deepEqual(Object.keys(artifact.paths), Object.keys(fixture.paths));
  for (const [route, pathItem] of Object.entries(fixture.paths)) {
    for (const [method, source] of Object.entries(pathItem)) {
      const published = artifact.paths[route][method];
      assert.equal(published.operationId, source.operationId);
      assert.equal(published.summary, source.summary);
      assert.equal(published.description, source.description);
    }
  }

  const form = artifact.paths["/forms/{slug}/"].patch;
  assert.equal(form["x-formaloo-mcp"].tool_name, "patch_form");
  assert.equal(form["x-formaloo-mcp"].auth.api_key.required, false);
  assert.equal(form["x-formaloo-mcp"].auth.workspace.required, false);
  assert.equal(form["x-formaloo-mcp"].requires_workspace, null);
  assert.equal(artifact.components.parameters.ApiKey.required, false);
  assert.equal(form.parameters.find((parameter) => parameter.name === "x-workspace").required, false);
  assert.ok(form.parameters.find((parameter) => parameter.name === "slug").description.trim());
  const request = form.requestBody.content["application/json"];
  assert.deepEqual(request.schema, fixture.paths["/forms/{slug}/"].patch.requestBody.content["application/json"].schema);
  assert.deepEqual(request.examples.backend_request.value, { title: "Backend example" });
  assert.equal(typeof request.examples.update_form_title.value.title, "string");
  const response = form.responses["200"].content["application/json"];
  assert.deepEqual(response.examples.backend_response.value, { status: 200, errors: {}, data: { title: "Backend example" } });
  assert.equal(typeof response.examples.updated_form.value.data.title, "string");
  assert.deepEqual(artifact.components.schemas.FormalooFormsPartialUpdate200Response.properties.data, { $ref: "#/components/schemas/FormSettings" });

  // Included operation repairs continue to run even after standard text is source-owned.
  const catalog = artifact.paths["/lead-enrichments/enrichable-fields/"].get;
  assert.equal(catalog["x-formaloo-mcp"].tool_name, "list_lead_enrichment_fields");
  assert.equal(catalog["x-formaloo-mcp"].auth.workspace.required, false);
  assert.deepEqual(artifact.components.schemas.LeadEnrichmentEnrichableField.required, ["key", "display_name"]);
  assert.ok(catalog.responses["200"].content["application/json"].schema);
});

for (const [label, unusable] of [
  ["absent", undefined], ["empty", ""], ["whitespace", " \n\t "],
  ["null", null], ["number", 12], ["boolean", false],
  ["unresolved reference", { $ref: "#/missing/documentation" }]
]) {
  for (const missingField of ["summary", "description"]) {
    test(`fills ${label} ${missingField} independently in both fallback tables`, async (t) => {
      const source = structuredClone(fixture);
      for (const entry of coveredOperations) {
        source.paths[entry.path][entry.method][missingField] = unusable;
      }
      const artifact = await buildArtifact(t, source);
      for (const entry of coveredOperations) {
        const published = artifact.paths[entry.path][entry.method];
        const preservedField = missingField === "summary" ? "description" : "summary";
        assert.equal(published.operationId, fixture.paths[entry.path][entry.method].operationId);
        assert.equal(published[preservedField], fixture.paths[entry.path][entry.method][preservedField]);
        assert.equal(typeof published[missingField], "string");
        assert.ok(published[missingField].trim());
      }
      assert.equal(artifact.paths["/forms/{slug}/"].patch["x-formaloo-mcp"].tool_name, "patch_form");
    });
  }
}

test("retains backend context, header requirements and inherited selection semantics", async(t)=>{
  const source=structuredClone(fixture);
  source.components.parameters.ApiKey.description="Backend API-key prerequisite.";
  const pathItem=source.paths["/forms/{slug}/"];
  pathItem.parameters=[{name:"Authorization",in:"header",required:false,schema:{type:"string"},description:"Session or JWT from the source."}];
  const form=pathItem.patch;
  form.parameters.find(p=>p.name==="x-workspace").description="Optional selector when workspace key binds tenant.";
  form["x-formaloo-request-context"]={version:1,workspace:{requirement:"required",resolution:"workspace_key_then_selector"}};
  form.security=[{jwtAuth:[]}];
  source.components.securitySchemes={jwtAuth:{type:"apiKey",in:"header",name:"Authorization"}};
  const artifact=await buildArtifact(t,source);
  const actual=artifact.paths["/forms/{slug}/"].patch;
  assert.deepEqual(actual.parameters.filter(p=>p.in==="header" || p.$ref),form.parameters.filter(p=>p.in==="header" || p.$ref));
  assert.deepEqual(artifact.paths["/forms/{slug}/"].parameters,pathItem.parameters);
  assert.deepEqual(artifact.components.parameters.ApiKey,source.components.parameters.ApiKey);
  assert.deepEqual(actual.security,form.security);
  assert.deepEqual(actual["x-formaloo-request-context"],form["x-formaloo-request-context"]);
  assert.equal(actual["x-formaloo-mcp"].auth.workspace.required,false);
  assert.equal(actual["x-formaloo-mcp"].auth.workspace.context_requirement,"required");
  assert.equal(actual["x-formaloo-mcp"].requires_workspace,true);
});
test("required inherited API header remains required and backend MCP metadata wins",async(t)=>{
  const source=structuredClone(fixture);
  const item=source.paths["/forms/{slug}/"];
  item.parameters=[{name:"x-api-key",in:"header",required:true,schema:{type:"string"}}];
  item.patch.parameters=item.patch.parameters.filter(p=>!p.$ref);
  item.patch["x-formaloo-mcp"]={tool_name:"backend_form_task",requires_workspace:false,auth:{provenance:"backend_review",workspace:{required:false}}};
  const artifact=await buildArtifact(t,source);
  const form=artifact.paths["/forms/{slug}/"].patch;
  assert.equal(artifact.paths["/forms/{slug}/"].parameters[0].required,true);
  assert.equal(form["x-formaloo-mcp"].tool_name,"backend_form_task");
  assert.equal(form["x-formaloo-mcp"].requires_workspace,false);
  assert.deepEqual(form["x-formaloo-mcp"].auth,item.patch["x-formaloo-mcp"].auth);
});
