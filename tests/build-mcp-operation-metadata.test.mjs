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
  {
    path: "/forms/{slug}/", method: "patch",
    fallbackSummary: "Partially update a form",
    fallbackDescription: /^Updates selected editable fields on a form in the active workspace\./
  },
  {
    path: "/fields/ai-box/", method: "post",
    fallbackSummary: "Create an AI box field",
    fallbackDescription: /^Creates an AI box field definition for a form or board\.$/
  }
];

async function buildArtifact(t, source) {
  // Run the publisher entry point, with its real settings, in a disposable tree.
  // Each test owns its input/output so it never overwrites fetched build artifacts.
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-metadata-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "scripts"));
  await fs.mkdir(path.join(root, "spec"));
  await fs.mkdir(path.join(root, "artifacts", "intermediate"), { recursive: true });
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
  assert.equal(form["x-formaloo-mcp"].auth.api_key.required, true);
  assert.equal(form["x-formaloo-mcp"].auth.workspace.required, true);
  assert.equal(artifact.components.parameters.ApiKey.required, true);
  assert.equal(form.parameters.find((parameter) => parameter.name === "x-workspace").required, true);
  assert.equal(form.parameters.find((parameter) => parameter.name === "slug").description, "Form slug.");
  const request = form.requestBody.content["application/json"];
  assert.deepEqual(request.schema, fixture.paths["/forms/{slug}/"].patch.requestBody.content["application/json"].schema);
  assert.deepEqual(request.examples.backend_request.value, { title: "Backend example" });
  assert.deepEqual(request.examples.update_form_title.value, { title: "Updated Customer Feedback" });
  const response = form.responses["200"].content["application/json"];
  assert.deepEqual(response.examples.backend_response.value, { status: 200, errors: {}, data: { title: "Backend example" } });
  assert.equal(response.examples.updated_form.value.data.title, "Updated Customer Feedback");
  assert.deepEqual(artifact.components.schemas.FormalooFormsPartialUpdate200Response.properties.data, { $ref: "#/components/schemas/FormSettings" });

  // Included operation repairs continue to run even after standard text is source-owned.
  const catalog = artifact.paths["/lead-enrichments/enrichable-fields/"].get;
  assert.equal(catalog["x-formaloo-mcp"].tool_name, "list_lead_enrichment_fields");
  assert.equal(catalog["x-formaloo-mcp"].auth.workspace.required, true);
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
        assert.equal(published[preservedField], fixture.paths[entry.path][entry.method][preservedField]);
        if (missingField === "summary") {
          assert.equal(published.summary, entry.fallbackSummary);
        } else {
          assert.match(published.description, entry.fallbackDescription);
        }
      }
      assert.equal(artifact.paths["/forms/{slug}/"].patch["x-formaloo-mcp"].tool_name, "patch_form");
    });
  }
}
