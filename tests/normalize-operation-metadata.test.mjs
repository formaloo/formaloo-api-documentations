import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const runFile = promisify(execFile);
const sourceRoot = new URL("../", import.meta.url);
const operations = [
  ["/v3.0/form-displays/slug/{slug}/submit/", "post", "formDisplaysSlugSubmitCreate"],
  ["/v3.0/fields/", "post", "fieldsCreate"],
  ["/v3.0/fields/rating/", "post", "fieldsRatingCreate"],
  ["/v3.0/fields/multiple-select/", "post", "fieldsMultipleSelectCreate"],
  ["/v3.0/forms/{slug}/rows/", "get", "formsRowsList"],
  ["/v3.0/hubspot-integrations/properties/", "get", "hubspotIntegrationsPropertiesRetrieve"],
  ["/v3.0/mailchimp-integrations/lists/", "get", "mailchimpIntegrationsListsRetrieve"],
  ["/v3.0/mailchimp-integrations/merge-fields/", "get", "mailchimpIntegrationsListsMergeFieldsRetrieve"],
  ["/v3.0/sendinblue-integrations/lists/", "get", "sendinblueIntegrationsListsRetrieve"],
  ["/v3.0/sendinblue-integrations/attributes/", "get", "sendinblueIntegrationsAttributesRetrieve"],
  ["/v3.0/netsuite-integrations/metadata/", "get", "netsuiteIntegrationsMetadataRetrieve"],
  ["/v3.0/notion-workspaces/databases/", "get", "notionWorkspacesNotionDatabasesRetrieve"]
];

function sourceSpec() {
  return {
    openapi: "3.0.3", info: { title: "Source prose fixture", version: "1.0" },
    components: { schemas: { ActionArgumentRequest: { type: "object", properties: { value: { type: "string" } } } } },
    paths: Object.fromEntries(operations.map(([route, method, operationId]) => [route, {
      [method]: {
        operationId,
        summary: `  Backend ${operationId} summary  `,
        description: `  Backend ${operationId} description.\n\nAdditional source detail.\n`,
        ...(method === "post" ? {
          requestBody: { content: { "application/json": { schema: { type: "object" } } } }
        } : {}),
        responses: { "200": { description: "Source response." } }
      }
    }]))
  };
}

async function normalize(t, source) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "normalize-metadata-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "scripts"));
  await fs.mkdir(path.join(root, "spec"));
  await fs.mkdir(path.join(root, "artifacts", "intermediate"), { recursive: true });
  for (const script of ["normalize-openapi.mjs", "form-answer-contract.mjs", "logic-schema-source.mjs"]) {
    await fs.copyFile(new URL(`scripts/${script}`, sourceRoot), path.join(root, "scripts", script));
  }
  for (const filename of ["public-contract.json", "integration-mapping-schemas.json", "tag-metadata.json"]) {
    await fs.copyFile(new URL(`spec/${filename}`, sourceRoot), path.join(root, "spec", filename));
  }
  await fs.writeFile(path.join(root, "artifacts", "intermediate", "openapi-merged.raw.json"), JSON.stringify(source));
  await runFile(process.execPath, [path.join(root, "scripts", "normalize-openapi.mjs")], {
    env: { ...process.env, RAW_SPEC_NAME: "openapi-merged.raw.json", NORMALIZED_SPEC_NAME: "openapi-public.normalized.json" }
  });
  return JSON.parse(await fs.readFile(path.join(root, "artifacts", "intermediate", "openapi-public.normalized.json"), "utf8"));
}

test("normalization preserves source operation prose across discovery and field/submit/row enrichment", async (t) => {
  const source = sourceSpec();
  const artifact = await normalize(t, source);
  assert.deepEqual(Object.keys(artifact.paths).sort(), Object.keys(source.paths).sort());
  for (const [route, method, operationId] of operations) {
    const published = artifact.paths[route][method];
    assert.equal(published.operationId, operationId);
    assert.equal(published.summary, source.paths[route][method].summary);
    assert.equal(published.description, source.paths[route][method].description);
  }
  assert.equal(artifact.paths["/v3.0/fields/"].post.requestBody.required, true);
  assert.ok(artifact.paths["/v3.0/fields/"].post.requestBody.content["application/json"].schema.$ref);
  assert.ok(artifact.paths["/v3.0/fields/rating/"].post.requestBody.content["application/json"].examples);
  assert.ok(artifact.paths["/v3.0/forms/{slug}/rows/"].get.parameters.some((parameter) => parameter.name === "page_size"));
  for (const [route, method] of operations.slice(5)) {
    assert.ok(artifact.paths[route][method].responses["200"].content["application/json"].schema);
  }
});

for (const [label, unusable] of [
  ["absent", undefined], ["blank", " \n\t"], ["non-string", 42],
  ["unresolved reference", { $ref: "#/missing/description" }]
]) {
  test(`normalization fills ${label} descriptions while preserving source summaries`, async (t) => {
    const source = sourceSpec();
    for (const [route, method] of operations) {
      source.paths[route][method].description = unusable;
    }
    source.paths["/v3.0/forms/{slug}/rows/"].get.summary = unusable;
    const artifact = await normalize(t, source);
    for (const [route, method, operationId] of operations) {
      const published = artifact.paths[route][method];
      assert.equal(published.operationId, operationId);
      assert.equal(typeof published.description, "string");
      assert.ok(published.description.trim());
      if (operationId !== "formsRowsList") {
        assert.equal(published.summary, source.paths[route][method].summary);
      } else {
        assert.equal(typeof published.summary, "string");
        assert.ok(published.summary.trim());
      }
    }
  });
}

test("normalization preserves source-owned auth and tenant header declarations",async(t)=>{
  const source=sourceSpec();
  const form=source.paths["/v3.0/form-displays/slug/{slug}/submit/"].post;
  form.parameters=[{in:"header",name:"x-api-key",required:false,schema:{type:"string"},description:"Source application prerequisite."},{in:"header",name:"x-workspace",required:false,schema:{type:"string"},description:"Source tenant-key exception."}];
  source.paths["/v3.0/form-displays/slug/{slug}/submit/"].parameters=[{in:"header",name:"x-app-id",required:true,schema:{type:"string"},description:"Source portal context."}];
  form["x-formaloo-request-context"]={version:1,actor_realm:"respondent"};
  const artifact=await normalize(t,source);
  const actual=artifact.paths["/v3.0/form-displays/slug/{slug}/submit/"].post;
  for(const header of form.parameters)assert.deepEqual(actual.parameters.find(p=>p.name===header.name),header);
  assert.ok(!actual.parameters.some(p=>p.name==="x-app-id"));
  assert.deepEqual(artifact.paths["/v3.0/form-displays/slug/{slug}/submit/"].parameters,source.paths["/v3.0/form-displays/slug/{slug}/submit/"].parameters);
  assert.deepEqual(actual["x-formaloo-request-context"],form["x-formaloo-request-context"]);
});

test("normalization keeps backend authentication alternatives, scopes and anonymous access",async(t)=>{
  const source=sourceSpec();
  source.components.securitySchemes={cookieAuth:{type:"apiKey",in:"cookie",name:"sessionid"},basicAuth:{type:"http",scheme:"basic"},jwtAuth:{type:"apiKey",in:"header",name:"Authorization"},oauth2:{type:"oauth2",flows:{authorizationCode:{authorizationUrl:"https://example.com/authorize",tokenUrl:"https://example.com/token",scopes:{read:"Read data"}}}}};
  const op=source.paths["/v3.0/forms/{slug}/rows/"].get;
  op.security=[{cookieAuth:[]},{basicAuth:[]},{jwtAuth:[]},{oauth2:["read"]},{}];
  const result=await normalize(t,source);
  assert.deepEqual(result.paths["/v3.0/forms/{slug}/rows/"].get.security,op.security);
});
test("unresolved authentication schemes fail normalization rather than dropping a source gate",async(t)=>{
  const source=sourceSpec();source.paths["/v3.0/forms/{slug}/rows/"].get.security=[{missingAuth:[]}];
  await assert.rejects(()=>normalize(t,source),/Unresolved source security scheme/);
});
